import { Box, Edges } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette, Noise } from "@react-three/postprocessing";
import { useAtomValue } from "jotai";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  activeFaceAtom,
  collisionBlockAtom,
  currentBlockAtom,
  gameOverMessageAtom,
  gridsAtom,
  isFocusModeAtom,
  isGameOverAtom,
  isWarningAtom,
  levelAtom,
  showGhostAtom,
} from "../atoms/gameAtoms";
import { GRID_HEIGHT, GRID_WIDTH, isValidMove } from "../engine/grid";
import { TetrisBlock, TETROMINOS } from "../engine/TetrisBlock";
import { useGameActions } from "../hooks/useGameActions";

const BLOCK_SIZE = 1;
const BOARD_WIDTH = GRID_WIDTH * BLOCK_SIZE;
const BOARD_HEIGHT = GRID_HEIGHT * BLOCK_SIZE;

// --- UI Components (non-R3F) ---
const GameOverOverlay = () => {
  const [showText, setShowText] = useState(true);
  const gameOverMessage = useAtomValue(gameOverMessageAtom);

  useEffect(() => {
    const blinker = setInterval(() => setShowText((prev) => !prev), 500);
    return () => clearInterval(blinker);
  }, []);

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 0, 0, 0.75)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#ff003c",
    fontFamily: "'Cutive Mono', 'Courier New', monospace",
    zIndex: 100,
    textShadow:
      "0 0 5px #ff003c, 0 0 10px #ff003c, 0 0 20px #ff003c, 0 0 40px #ff003c",
    backdropFilter: "blur(3px)",
    border: "2px solid #ff003c",
    boxShadow: "inset 0 0 20px #ff003c, 0 0 20px #ff003c",
  };
  const h1Style: React.CSSProperties = {
    fontSize: "clamp(2rem, 10vw, 5rem)",
    marginBottom: "1rem",
    letterSpacing: "0.2rem",
    textAlign: "center",
    textTransform: "uppercase",
    animation: "flicker 1.5s infinite alternate",
  };
  const pStyle: React.CSSProperties = {
    fontSize: "clamp(1rem, 5vw, 1.5rem)",
    transition: "opacity 0.5s ease-in-out",
    opacity: showText ? 1 : 0.3,
    textTransform: "uppercase",
  };
  const keyframes = `
    @keyframes flicker {
      0%, 18%, 22%, 25%, 53%, 57%, 100% {
        text-shadow:
          0 0 4px #ff003c,
          0 0 11px #ff003c,
          0 0 19px #ff003c,
          0 0 40px #ff003c,
          0 0 80px #ff003c;
      }
      20%, 24%, 55% {
        text-shadow: none;
      }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div style={overlayStyle}>
        <h1 style={h1Style}>{gameOverMessage}</h1>
        <p style={pStyle}>PRESS [SPACE] TO RESTART</p>
      </div>
    </>
  );
};

const GameBoardBoundary = () => {
  const isFocusMode = useAtomValue(isFocusModeAtom);

  const gridLines = useMemo(() => {
    const lines = [];
    const color = "#00ffff";
    const opacity = 0.3;

    for (let i = 0; i <= GRID_HEIGHT; i++) {
      const y = i * BLOCK_SIZE - BOARD_HEIGHT / 2;
      lines.push(
        <mesh key={`h-${i}`} position={[0, y, BOARD_WIDTH / 2 + 0.01]}>
          <planeGeometry args={[BOARD_WIDTH, 0.03]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      );
    }

    for (let i = 0; i <= GRID_WIDTH; i++) {
      const x = i * BLOCK_SIZE - BOARD_WIDTH / 2;
      lines.push(
        <mesh key={`v-${i}`} position={[x, 0, BOARD_WIDTH / 2 + 0.01]}>
          <planeGeometry args={[0.03, BOARD_HEIGHT]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      );
    }
    return lines;
  }, []);

  const activeFace = useAtomValue(activeFaceAtom);

  return (
    <group>
      <Box args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_WIDTH]}>
        <meshBasicMaterial
          transparent
          opacity={isFocusMode ? 0.9 : 0.05}
          color={isFocusMode ? "#000000" : "#00ffff"}
          side={THREE.DoubleSide}
        />
        <Edges threshold={15} color="#00ffff" />
      </Box>

      <group rotation={[0, activeFace * (Math.PI / 2), 0]}>{gridLines}</group>
    </group>
  );
};

const TetrisBlock3D = ({
  position,
  color,
  opacity = 1.0,
}: {
  position: THREE.Vector3;
  color: string;
  opacity?: number;
}) => (
  <Box args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} position={position}>
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.3}
      toneMapped={false}
      transparent={opacity < 1.0}
      opacity={opacity}
    />
    <Edges threshold={15} color={color} />
  </Box>
);

const CollisionBlock3D = ({
  position,
}: {
  position: THREE.Vector3;
}) => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const color = "#ff0000"; // Intense Red

  useFrame(({ clock }) => {
    // Create a smooth, intense pulse effect
    const intensity = (Math.sin(clock.elapsedTime * 10) + 1) / 2; // 0 to 1
    materialRef.current.emissiveIntensity = 2.0 + intensity * 8.0; // Pulse from 2.0 to 10.0
  });

  return (
    <Box args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} position={position}>
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        toneMapped={false}
      />
      <Edges threshold={15} color={color} />
    </Box>
  );
};

const GhostBlock3D = ({ position }: { position: THREE.Vector3 }) => (
  <Box args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} position={position}>
    <meshBasicMaterial
      color="white"
      transparent
      opacity={0.2}
      toneMapped={false}
    />
    <Edges color="white" />
  </Box>
);

const GameBoardFace = ({
  grid,
  faceIndex,
  isFocusMode,
  activeFace,
}: {
  grid: (string | number)[][];
  faceIndex: number;
  isFocusMode: boolean;
  activeFace: number;
}) => {
  const groupRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    const angle = faceIndex * (Math.PI / 2);
    groupRef.current.rotation.y = angle;
  }, [faceIndex]);

  const opacity = isFocusMode && faceIndex !== activeFace ? 0.05 : 1.0;

  return (
    <group ref={groupRef}>
      {grid.map((row, y) =>
        row.map((cell, x) => {
          if (cell !== 0) {
            const position = new THREE.Vector3(
              x * BLOCK_SIZE - BOARD_WIDTH / 2 + BLOCK_SIZE / 2,
              (GRID_HEIGHT - y) * BLOCK_SIZE -
                BOARD_HEIGHT / 2 -
                BLOCK_SIZE / 2,
              BOARD_WIDTH / 2
            );
            const color = TETROMINOS[cell as keyof typeof TETROMINOS].color;
            return (
              <TetrisBlock3D
                key={`${y}-${x}`}
                position={position}
                color={color}
                opacity={opacity}
              />
            );
          }
          return null;
        })
      )}
    </group>
  );
};

const CAMERA_DISTANCE = 24;

const GameScene = () => {
  const grids = useAtomValue(gridsAtom);
  const activeFace = useAtomValue(activeFaceAtom);
  const currentBlock = useAtomValue(currentBlockAtom);
  const showGhost = useAtomValue(showGhostAtom);
  const isFocusMode = useAtomValue(isFocusModeAtom);
  const isWarning = useAtomValue(isWarningAtom);
  const collisionBlock = useAtomValue(collisionBlockAtom);

  const currentBlockGroupRef = useRef<THREE.Group>(null!);
  const tempQuaternion = new THREE.Quaternion();
  const warningStartTime = useRef(0);

  useEffect(() => {
    if (isWarning) {
      warningStartTime.current = performance.now();
    }
  }, [isWarning]);

  useFrame((state) => {
    const targetAngle = activeFace * (Math.PI / 2);
    const targetRotation = new THREE.Euler(0, targetAngle, 0);
    tempQuaternion.setFromEuler(targetRotation);

    state.camera.quaternion.slerp(tempQuaternion, 0.1);

    const basePosition = new THREE.Vector3(0, 0, CAMERA_DISTANCE).applyQuaternion(state.camera.quaternion);

    if (isWarning) {
      const elapsedTime = performance.now() - warningStartTime.current;
      const decay = Math.max(0, 1 - elapsedTime / 800);
      const shakeIntensity = 0.2 * decay * decay; // Use ease-out (quadratic)
      
      basePosition.x += (Math.random() - 0.5) * shakeIntensity;
      basePosition.y += (Math.random() - 0.5) * shakeIntensity;
    }
    
    state.camera.position.lerp(basePosition, 0.5);
    state.camera.lookAt(0, 0, 0);

    if (currentBlockGroupRef.current) {
      currentBlockGroupRef.current.quaternion.slerp(tempQuaternion, 0.2);
    }
  });

  const calculateGhostPosition = useMemo(() => {
    if (!currentBlock || !showGhost) return null;
    const grid = grids[activeFace];
    let ghostY = currentBlock.position.y;
    const ghostBlockInstance = new TetrisBlock(currentBlock.type);
    ghostBlockInstance.shape = currentBlock.shape;

    while (
      isValidMove(grid, ghostBlockInstance, {
        x: currentBlock.position.x,
        y: ghostY + 1,
      })
    ) {
      ghostY++;
    }
    ghostBlockInstance.position = { x: currentBlock.position.x, y: ghostY };
    return ghostBlockInstance;
  }, [currentBlock, activeFace, grids, showGhost]);

  const renderBlock = (block: TetrisBlock, isGhost = false, isCollision = false) => {
    return block.shape.map((row: (string | number)[], y: number) =>
      row.map((cell: string | number, x: number) => {
        if (cell !== 0) {
          const position = new THREE.Vector3(
            (block.position.x + x) * BLOCK_SIZE -
              BOARD_WIDTH / 2 +
              BLOCK_SIZE / 2,
            (GRID_HEIGHT - (block.position.y + y)) * BLOCK_SIZE -
              BOARD_HEIGHT / 2 -
              BLOCK_SIZE / 2,
            BOARD_WIDTH / 2
          );
          if (isCollision) {
            return <CollisionBlock3D key={`${y}-${x}`} position={position} />;
          }
          if (isGhost) {
            return <GhostBlock3D key={`${y}-${x}`} position={position} />;
          }
          return (
            <TetrisBlock3D
              key={`${y}-${x}`}
              position={position}
              color={block.color}
            />
          );
        }
        return null;
      })
    );
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 20]} intensity={1.0} />
      <group>
        {grids.map((grid: (string | number)[][], index: number) => (
          <GameBoardFace
            key={index}
            grid={grid}
            faceIndex={index}
            isFocusMode={isFocusMode}
            activeFace={activeFace}
          />
        ))}
        <group ref={currentBlockGroupRef}>
          {!isWarning && currentBlock && renderBlock(currentBlock)}
          {isWarning && collisionBlock && renderBlock(collisionBlock, false, true)}
          {!isWarning && calculateGhostPosition && renderBlock(calculateGhostPosition, true)}
        </group>
      </group>
      <EffectComposer>
        <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} height={300} />
        <Noise premultiply opacity={isWarning ? 0.25 : 0} />
        <Vignette
          eskil={false}
          offset={isWarning ? 0.2 : 0.5}
          darkness={isWarning ? 1.2 : 0.5}
        />
      </EffectComposer>
    </>
  );
};


const LevelUpOverlay = () => {
  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "#00ffff",
    fontSize: "5rem",
    fontFamily: "'Cutive Mono', 'Courier New', monospace",
    textShadow: "0 0 15px #00ffff, 0 0 25px #00ffff",
    zIndex: 200,
    pointerEvents: "none",
    animation: "levelUp-fade-out 0.5s forwards",
  };

  const keyframes = `
        @keyframes levelUp-fade-out {
            from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            to { opacity: 0; transform: translate(-50%, -80%) scale(1.2); }
        }
    `;

  return (
    <>
      <style>{keyframes}</style>
      <div style={overlayStyle}>LEVEL UP</div>
    </>
  );
};

const GameBoard3D: React.FC = () => {
  const isGameOver = useAtomValue(isGameOverAtom);
  const level = useAtomValue(levelAtom);
  const { handleTouchStart, handleTouchEnd } = useGameActions();

  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gameContainer = gameContainerRef.current;
    if (gameContainer) {
      gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });

      return () => {
        gameContainer.removeEventListener('touchstart', handleTouchStart);
        gameContainer.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleTouchStart, handleTouchEnd]);

  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    if (level > prevLevelRef.current) {
      setLevelUpFlash(true);
      const timer = setTimeout(() => setLevelUpFlash(false), 500);
      prevLevelRef.current = level;
      return () => clearTimeout(timer);
    } else if (level < prevLevelRef.current) {
      prevLevelRef.current = level;
    }
  }, [level]);

  return (
    <div 
      style={{ position: "relative", height: "100%", width: "100%", touchAction: 'none !important', userSelect: 'none', WebkitTouchCallout: 'none' }}
      ref={gameContainerRef}
    >
      {isGameOver && <GameOverOverlay />}
      {levelUpFlash && <LevelUpOverlay />}
      <Canvas
        style={{ height: "100%", width: "100%", background: "#050505" }}
        camera={{ fov: 60, position: [0, 0, 24] }}
      >
        <GameScene />
        <GameBoardBoundary />
      </Canvas>
    </div>
  );
};

export default GameBoard3D;