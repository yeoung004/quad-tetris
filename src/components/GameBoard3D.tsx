import { Box, Edges, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  GameAction,
  GameState,
  GRID_HEIGHT,
  GRID_WIDTH,
} from "../engine/gameReducer";
import { TETROMINOS } from "../engine/TetrisBlock";

// 1. Game Over UI & Restart UX
const GameOverOverlay = ({
  dispatch,
}: {
  dispatch: React.Dispatch<GameAction>;
}) => {
  const [showText, setShowText] = useState(true);

  // Blinking effect for the restart text
  useEffect(() => {
    const blinker = setInterval(() => {
      setShowText((prev) => !prev);
    }, 700);
    return () => clearInterval(blinker);
  }, []);

  // Spacebar listener to restart the game
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        dispatch({ type: "START_GAME" });
      }
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

type GameBoard3DProps = {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
};

const BLOCK_SIZE = 1;
const BOARD_WIDTH = GRID_WIDTH * BLOCK_SIZE;
const BOARD_HEIGHT = GRID_HEIGHT * BLOCK_SIZE;

const GameBoardBoundary = () => {
  return (
    <group>
      <mesh position={[0, -BOARD_HEIGHT / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BOARD_WIDTH, BOARD_WIDTH]} />
        <meshBasicMaterial color="#111111" transparent opacity={0.6} />
      </mesh>
      <Box args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_WIDTH]}>
        <meshBasicMaterial transparent opacity={0.05} color="#00ffff" />
        <Edges threshold={15} color="#00ffff">
          <meshBasicMaterial color="#00ffff" toneMapped={false} />
        </Edges>
      </Box>
      <gridHelper
        args={[BOARD_WIDTH, GRID_WIDTH, "#00ffff", "#222222"]}
        position={[0, -BOARD_HEIGHT / 2, 0]}
      />
    </group>
  );
};

const TetrisBlock3D = ({
  type,
  position,
  color,
}: {
  type: string | number;
  position: THREE.Vector3;
  color: string;
}) => {
  if (type === 0) return null;

  return (
    <Box args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} position={position}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
        toneMapped={false}
      />
      <Edges threshold={15} color={color}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </Edges>
    </Box>
  );
};

const GameBoardFace = ({
  grid,
  faceIndex,
}: {
  grid: (string | number)[][];
  faceIndex: number;
}) => {
  const groupRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    const angle = faceIndex * (Math.PI / 2);
    groupRef.current.rotation.y = angle;

    const halfWidth = BOARD_WIDTH / 2;
    if (faceIndex === 0) groupRef.current.position.set(0, 0, halfWidth);
    else if (faceIndex === 1) groupRef.current.position.set(halfWidth, 0, 0);
    else if (faceIndex === 2) groupRef.current.position.set(0, 0, -halfWidth);
    else if (faceIndex === 3) groupRef.current.position.set(-halfWidth, 0, 0);
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
              0
            );
            const color = TETROMINOS[cell as keyof typeof TETROMINOS].color;
            return (
              <TetrisBlock3D
                key={`${y}-${x}`}
                type={cell}
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

const AnimatedCamera = ({ activeFace }: { activeFace: number }) => {
  const targetRotation = new THREE.Euler(0, activeFace * (Math.PI / 2), 0);

  useFrame((state) => {
    state.camera.quaternion.slerp(
      new THREE.Quaternion().setFromEuler(targetRotation),
      0.1
    );
  });

  return (
    <OrbitControls
      enableZoom={false}
      enablePan={false}
      // 2. Mouse Drag Deactivated
      enableRotate={false}
      minPolarAngle={Math.PI / 2}
      maxPolarAngle={Math.PI / 2}
    />
  );
};

const GameBoard3D: React.FC<GameBoard3DProps> = ({ gameState, dispatch }) => {
  const { grids, activeFace, currentBlock, isGameOver } = gameState;
  const currentBlockGroupRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGameOver) return;
      const key = event.key.toLowerCase();
      if (key === "q") {
        dispatch({ type: "CHANGE_FACE", payload: { direction: "left" } });
      } else if (key === "e") {
        dispatch({ type: "CHANGE_FACE", payload: { direction: "right" } });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, isGameOver]);

  // 4. Block Synchronization Logic
  // This effect synchronizes the currentBlock's group rotation and position with the activeFace
  useEffect(() => {
    if (!currentBlockGroupRef.current) return;

    const angle = activeFace * (Math.PI / 2);
    currentBlockGroupRef.current.rotation.y = angle;

    const halfWidth = BOARD_WIDTH / 2;
    if (activeFace === 0) currentBlockGroupRef.current.position.set(0, 0, halfWidth);
    else if (activeFace === 1) currentBlockGroupRef.current.position.set(halfWidth, 0, 0);
    else if (activeFace === 2) currentBlockGroupRef.current.position.set(0, 0, -halfWidth);
    else if (activeFace === 3) currentBlockGroupRef.current.position.set(-halfWidth, 0, 0);
  }, [activeFace]);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      {isGameOver && <GameOverOverlay dispatch={dispatch} />}
      <Canvas
        style={{ height: "100%", width: "100%", background: "#050505" }}
        // 3. Camera Position Optimized
        camera={{ position: [0, 0, 20], fov: 75 }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 20]} intensity={1} />

        <AnimatedCamera activeFace={activeFace} />

        <group>
          <GameBoardBoundary />

          {grids.map((grid, index) => (
            <GameBoardFace key={index} grid={grid} faceIndex={index} />
          ))}

          {currentBlock && (
            <group ref={currentBlockGroupRef}>
              {currentBlock.shape.map((row, y) =>
                row.map((cell, x) => {
                  if (cell !== 0) {
                    // The block is rendered at z=0 relative to its group.
                    // The group itself is then translated and rotated to the correct face.
                    const position = new THREE.Vector3(
                      (currentBlock.position.x + x) * BLOCK_SIZE -
                        BOARD_WIDTH / 2 +
                        BLOCK_SIZE / 2,
                      (GRID_HEIGHT - (currentBlock.position.y + y)) *
                        BLOCK_SIZE -
                        BOARD_HEIGHT / 2 -
                        BLOCK_SIZE / 2,
                      0 // Set to 0, as the group's position handles the depth
                    );
                    return (
                      <TetrisBlock3D
                        key={`${y}-${x}`}
                        type={cell}
                        position={position}
                        color={currentBlock.color}
                      />
                    );
                  }
                  return null;
                })
              )}
            </group>
          )}
        </group>

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={1.5}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default GameBoard3D;