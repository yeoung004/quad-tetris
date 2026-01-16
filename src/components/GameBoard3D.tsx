import { Box, Edges } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  GameAction,
  GameState,
  GRID_HEIGHT,
  GRID_WIDTH,
  isValidMove,
} from "../engine/gameReducer";
import { TETROMINOS, TetrisBlock } from "../engine/TetrisBlock";

const BLOCK_SIZE = 1;
const BOARD_WIDTH = GRID_WIDTH * BLOCK_SIZE;
const BOARD_HEIGHT = GRID_HEIGHT * BLOCK_SIZE;

// --- UI Components (non-R3F) ---
const GameOverOverlay = ({
  dispatch,
}: {
  dispatch: React.Dispatch<GameAction>;
}) => {
  const [showText, setShowText] = useState(true);

  useEffect(() => {
    const blinker = setInterval(() => setShowText((prev) => !prev), 700);
    return () => clearInterval(blinker);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") dispatch({ type: "START_GAME" });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

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
      <h1 style={h1Style}>GAME OVER</h1>
      <p style={pStyle}>PRESS [SPACE] TO RESTART</p>
    </div>
  );
};

const NextBlockPreview = ({ nextBlock }: { nextBlock: TetrisBlock | null }) => {
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
            {shape.map((row, y) =>
              row.map((cell, x) => {
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

const GameBoardBoundary = () => (
  <group>
    <Box args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_WIDTH]}>
      <meshBasicMaterial transparent opacity={0.05} color="#00ffff" />
      <Edges threshold={15} color="#00ffff" />
    </Box>
  </group>
);

const TetrisBlock3D = ({
  position,
  color,
}: {
  position: THREE.Vector3;
  color: string;
}) => (
  <Box args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} position={position}>
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.3}
      toneMapped={false}
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
}: {
  grid: (string | number)[][];
  faceIndex: number;
}) => {
  const groupRef = useRef<THREE.Group>(null!);

  // This logic is now simplified as the block rendering handles face-specific transforms.
  useEffect(() => {
    const angle = faceIndex * (Math.PI / 2);
    groupRef.current.rotation.y = angle;
  }, [faceIndex]);

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
              BOARD_WIDTH / 2 // Render all settled blocks on the "front" of their rotated plane
            );
            const color = TETROMINOS[cell as keyof typeof TETROMINOS].color;
            return (
              <TetrisBlock3D
                key={`${y}-${x}`}
                position={position}
                color={color}
              />
            );
          }
          return null;
        })
      )}
    </group>
  );
};

const GameScene = ({ gameState }: { gameState: GameState }) => {
  const { grids, activeFace, currentBlock, showGhost } = gameState;
  const currentBlockGroupRef = useRef<THREE.Group>(null!);
  const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    // Smooth rotation for the active block group to match face changes
    if (currentBlockGroupRef.current) {
      const angle = activeFace * (Math.PI / 2);
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      currentBlockGroupRef.current.quaternion.slerp(targetQuaternion, 0.2);
    }
  });

  const calculateGhostPosition = useMemo(() => {
    if (!currentBlock || !showGhost) return null;
    const grid = grids[activeFace];
    let ghostY = currentBlock.position.y;
    const ghostBlockInstance = new TetrisBlock(currentBlock.type);
    ghostBlockInstance.shape = currentBlock.shape;
    
    // Find the furthest valid 'y' position
    while (isValidMove(grid, ghostBlockInstance, { x: currentBlock.position.x, y: ghostY + 1 })) {
      ghostY++;
    }
    ghostBlockInstance.position = { x: currentBlock.position.x, y: ghostY };
    return ghostBlockInstance;
  }, [currentBlock, activeFace, grids, showGhost]);

  const renderBlock = (block: TetrisBlock, isGhost = false) => {
    const Component = isGhost ? GhostBlock3D : TetrisBlock3D;
    const color = isGhost ? "white" : block.color;
    
    return block.shape.map((row, y) =>
      row.map((cell, x) => {
        if (cell !== 0) {
          // ** Z-Axis Fix Applied Here **
          // All active and ghost blocks are rendered on the Z-plane corresponding to the front of the cube.
          // The `currentBlockGroupRef` rotation handles which face is "front".
          const position = new THREE.Vector3(
            (block.position.x + x) * BLOCK_SIZE - BOARD_WIDTH / 2 + BLOCK_SIZE / 2,
            (GRID_HEIGHT - (block.position.y + y)) * BLOCK_SIZE - BOARD_HEIGHT / 2 - BLOCK_SIZE / 2,
            BOARD_WIDTH / 2 // Correct Z-depth for the active face
          );
          return <Component key={`${y}-${x}`} position={position} color={color} />;n        }
        return null;
      })
    );
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 20]} intensity={1.0} />
      <group>
        {grids.map((grid, index) => (
          <GameBoardFace key={index} grid={grid} faceIndex={index} />
        ))}
        {/* The group now only handles rotation; positioning is done in renderBlock */}
        <group ref={currentBlockGroupRef}>
          {currentBlock && renderBlock(currentBlock)}
          {calculateGhostPosition && renderBlock(calculateGhostPosition, true)}
        </group>
      </group>
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.5} />
      </EffectComposer>
    </>
  );
};

const AnimatedCamera = ({ activeFace }: { activeFace: number }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!);

  const targetQuaternions = useMemo(
    () => [
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0), // Face 0 (front)
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.PI / 2
      ), // Face 1 (right)
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.PI
      ), // Face 2 (back)
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        -Math.PI / 2
      ), // Face 3 (left)
    ],
    []
  );

  useFrame((state) => {
    // Correctly slerp the camera's quaternion
    const targetQuaternion = targetQuaternions[activeFace];
    if (targetQuaternion) {
      state.camera.quaternion.slerp(targetQuaternion, 0.15);
    }
  });

  return <perspectiveCamera ref={cameraRef} fov={60} position={[0, 0, 24]} />;
};

interface GameBoard3DProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameBoard3D: React.FC<GameBoard3DProps> = ({ gameState, dispatch }) => {
  const { isGameOver, nextBlock, activeFace } = gameState;

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      {isGameOver && <GameOverOverlay dispatch={dispatch} />}
      <NextBlockPreview nextBlock={nextBlock} />
      <Canvas
        style={{ height: "100%", width: "100%", background: "#050505" }}
        camera={{ fov: 60, position: [0, 0, 24] }} // Use a fixed position
      >
        <GameScene gameState={gameState} />
        <AnimatedCamera activeFace={activeFace} />
        <GameBoardBoundary />
      </Canvas>
    </div>
  );
};

export default GameBoard3D;
