import { Box, Edges } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useAtomValue } from "jotai";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  activeFaceAtom,
  currentBlockAtom,
  gameOverMessageAtom,
  gridsAtom,
  isFocusModeAtom,
  isGameOverAtom,
  levelAtom,
  nextBlockAtom,
  showGhostAtom,
} from "../atoms/gameAtoms";
import { GRID_HEIGHT, GRID_WIDTH, isValidMove } from "../engine/grid";
import { TetrisBlock, TETROMINOS } from "../engine/TetrisBlock";

const BLOCK_SIZE = 1;
const BOARD_WIDTH = GRID_WIDTH * BLOCK_SIZE;
const BOARD_HEIGHT = GRID_HEIGHT * BLOCK_SIZE;

// --- UI Components (non-R3F) ---
const GameOverOverlay = () => {
  const [showText, setShowText] = useState(true);
  const gameOverMessage = useAtomValue(gameOverMessageAtom);

  useEffect(() => {
    const blinker = setInterval(() => setShowText((prev) => !prev), 700);
    return () => clearInterval(blinker);
  }, []);

  // The keydown listener for restarting is now in GameController.tsx
  // This component is now purely for display.

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#00ffff",
    fontFamily: "'Cutive Mono', 'Courier New', monospace",
    zIndex: 100,
    textShadow: "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff",
  };
  const h1Style: React.CSSProperties = {
    fontSize: "5rem",
    marginBottom: "1rem",
    letterSpacing: "0.5rem",
  };
  const pStyle: React.CSSProperties = {
    fontSize: "1.5rem",
    transition: "opacity 0.7s ease-in-out",
    opacity: showText ? 1 : 0.2,
  };

  return (
    <div style={overlayStyle}>
      <h1 style={h1Style}>{gameOverMessage}</h1>
      <p style={pStyle}>PRESS [SPACE] TO RESTART</p>
    </div>
  );
};

const NextBlockPreview = () => {
  const nextBlock = useAtomValue(nextBlockAtom);
  if (!nextBlock) return null;

  const previewStyle: React.CSSProperties = {
    position: "absolute",
    top: "20px",
    right: "20px",
    width: "150px",
    height: "150px",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid #00ffff",
    borderRadius: "10px",
    zIndex: 100,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Cutive Mono', 'Courier New', monospace",
    color: "#00ffff",
    textShadow: "0 0 5px #00ffff",
  };

  const shape = nextBlock.shape;
  const shapeWidth = shape[0].length;
  const shapeHeight = shape.length;
  const offsetX = (4 - shapeWidth) / 2;
  const offsetY = (4 - shapeHeight) / 2;

  return (
    <div style={previewStyle}>
      <div style={{ textAlign: "center", padding: "5px", flexShrink: 0 }}>
        NEXT
      </div>
      <div style={{ flexGrow: 1, position: "relative" }}>
        <Canvas camera={{ fov: 30, position: [0, 0, 10] }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          <group scale={[0.9, 0.9, 0.9]}>
            {shape.map((row: (string | number)[], y: number) =>
              row.map((cell: string | number, x: number) => {
                if (cell !== 0) {
                  return (
                    <Box
                      key={`${y}-${x}`}
                      args={[1, 1, 1]}
                      position={[x + offsetX - 1.5, -(y + offsetY) + 1.5, 0]}
                    >
                      <meshStandardMaterial
                        color={nextBlock.color}
                        emissive={nextBlock.color}
                        emissiveIntensity={0.4}
                        toneMapped={false}
                      />
                      <Edges color={nextBlock.color} />
                    </Box>
                  );
                }
                return null;
              })
            )}
          </group>
        </Canvas>
      </div>
    </div>
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

  const currentBlockGroupRef = useRef<THREE.Group>(null!);
  const tempQuaternion = new THREE.Quaternion();

  useFrame((state) => {
    const targetAngle = activeFace * (Math.PI / 2);
    const targetRotation = new THREE.Euler(0, targetAngle, 0);
    tempQuaternion.setFromEuler(targetRotation);

    state.camera.quaternion.slerp(tempQuaternion, 0.1);

    state.camera.position
      .set(0, 0, CAMERA_DISTANCE)
      .applyQuaternion(state.camera.quaternion);

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

  const renderBlock = (block: TetrisBlock, isGhost = false) => {
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
          {currentBlock && renderBlock(currentBlock)}
          {calculateGhostPosition && renderBlock(calculateGhostPosition, true)}
        </group>
      </group>
      <EffectComposer>
        <Bloom luminanceSmoothing={0.9} />
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
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      {isGameOver && <GameOverOverlay />}
      {levelUpFlash && <LevelUpOverlay />}
      <NextBlockPreview />
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
