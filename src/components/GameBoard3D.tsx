import { Box, Edges, OrbitControls } from "@react-three/drei";
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

type GameBoard3DProps = {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
};

const BLOCK_SIZE = 1;
const BOARD_WIDTH = GRID_WIDTH * BLOCK_SIZE;
const BOARD_HEIGHT = GRID_HEIGHT * BLOCK_SIZE;

// --- UI Components (non-R3F) ---
const GameOverOverlay = ({ dispatch }: { dispatch: React.Dispatch<GameAction> }) => {
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
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)", display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center", color: "#00ffff",
    fontFamily: "'Cutive Mono', 'Courier New', monospace", zIndex: 100,
    textShadow: "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff",
  };
  const h1Style: React.CSSProperties = { fontSize: "5rem", marginBottom: "1rem", letterSpacing: "0.5rem" };
  const pStyle: React.CSSProperties = { fontSize: "1.5rem", transition: "opacity 0.7s ease-in-out", opacity: showText ? 1 : 0.2 };

  return (
    <div style={overlayStyle}>
      <h1 style={h1Style}>GAME OVER</h1>
      <p style={pStyle}>PRESS [SPACE] TO RESTART</p>
    </div>
  );
};


// --- R3F Components (to be used inside Canvas) ---

const GameBoardBoundary = () => (
  <group>
    <Box args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_WIDTH]}>
      <meshBasicMaterial transparent opacity={0.05} color="#00ffff" />
      <Edges threshold={15} color="#00ffff" />
    </Box>
    <gridHelper args={[BOARD_WIDTH, GRID_WIDTH, "#00ffff", "#222222"]} position={[0, -BOARD_HEIGHT / 2, 0]} />
  </group>
);

const TetrisBlock3D = ({ position, color }: { position: THREE.Vector3; color: string }) => (
  <Box args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} position={position}>
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} toneMapped={false} />
    <Edges threshold={15} color={color} />
  </Box>
);

const GhostBlock3D = ({ position }: { position: THREE.Vector3 }) => (
  <Box args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} position={position}>
    <Edges color="white">
      <meshBasicMaterial color="white" transparent opacity={0.25} toneMapped={false} />
    </Edges>
  </Box>
);

const GameBoardFace = ({ grid, faceIndex }: { grid: (string | number)[][]; faceIndex: number }) => {
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
              (GRID_HEIGHT - y) * BLOCK_SIZE - BOARD_HEIGHT / 2 - BLOCK_SIZE / 2,
              0
            );
            const color = TETROMINOS[cell as keyof typeof TETROMINOS].color;
            return <TetrisBlock3D key={`${y}-${x}`} position={position} color={color} />;
          }
          return null;
        })
      )}
    </group>
  );
};

/**
 * ## GameScene Component
 * This component contains all the Three.js objects and rendering logic.
 * It is rendered inside the Canvas and can safely use R3F hooks.
 */
const GameScene = ({ gameState }: { gameState: GameState; }) => {
  const { grids, activeFace, currentBlock, showGhost } = gameState;
  
  const currentBlockGroupRef = useRef<THREE.Group>(null!);
  const controlsRef = useRef<any>();

  const faceProperties = useMemo(() => {
    const CAMERA_DISTANCE = 22;
    const halfWidth = BOARD_WIDTH / 2;
    return [
        { camPos: new THREE.Vector3(0, 0, halfWidth + CAMERA_DISTANCE), target: new THREE.Vector3(0, 0, halfWidth) },
        { camPos: new THREE.Vector3(halfWidth + CAMERA_DISTANCE, 0, 0), target: new THREE.Vector3(halfWidth, 0, 0) },
        { camPos: new THREE.Vector3(0, 0, -halfWidth - CAMERA_DISTANCE), target: new THREE.Vector3(0, 0, -halfWidth) },
        { camPos: new THREE.Vector3(-halfWidth - CAMERA_DISTANCE, 0, 0), target: new THREE.Vector3(-halfWidth, 0, 0) },
    ];
  }, []);

  useFrame((state) => {
    const activeProps = faceProperties[activeFace];
    // Adjusting lerp alpha for a "snappier" camera movement
    state.camera.position.lerp(activeProps.camPos, 0.2); 
    if(controlsRef.current) {
        controlsRef.current.target.lerp(activeProps.target, 0.2);
        controlsRef.current.update();
    }
  });

  useEffect(() => {
    if (!currentBlockGroupRef.current) return;
    const { target } = faceProperties[activeFace];
    const angle = activeFace * (Math.PI / 2);
    currentBlockGroupRef.current.rotation.y = angle;
    currentBlockGroupRef.current.position.copy(target);
  }, [activeFace, faceProperties]);

  const ghostBlock = useMemo(() => {
    if (!currentBlock || !showGhost) return null;
    const grid = grids[activeFace];
    let ghostY = currentBlock.position.y;
    const ghostBlockInstance = new TetrisBlock(currentBlock.type);
    ghostBlockInstance.shape = currentBlock.shape;
    
    while(isValidMove(grid, ghostBlockInstance, { x: currentBlock.position.x, y: ghostY + 1 })) {
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
          const position = new THREE.Vector3(
            (block.position.x + x) * BLOCK_SIZE - BOARD_WIDTH / 2 + BLOCK_SIZE / 2,
            (GRID_HEIGHT - (block.position.y + y)) * BLOCK_SIZE - BOARD_HEIGHT / 2 - BLOCK_SIZE / 2,
            0
          );
          return <Component key={`${y}-${x}`} position={position} color={color} />;
        }
        return null;
      })
    );
  }

  return (
    <>
      <OrbitControls ref={controlsRef} enableZoom={false} enablePan={false} enableRotate={false} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 20]} intensity={0.8} />
      <group>
        <GameBoardBoundary />
        {grids.map((grid, index) => (
          <GameBoardFace key={index} grid={grid} faceIndex={index} />
        ))}
        {currentBlock && (
          <group ref={currentBlockGroupRef}>
            {renderBlock(currentBlock)}
            {ghostBlock && renderBlock(ghostBlock, true)}
          </group>
        )}
      </group>
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.2} />
      </EffectComposer>
    </>
  );
};


/**
 * ## GameBoard3D Component
 * This component now only handles global layout, keyboard events,
 * and hosts the Canvas for R3F rendering.
 */
const GameBoard3D: React.FC<GameBoard3DProps> = ({ gameState, dispatch }) => {
  const { isGameOver } = gameState;

  // Global keydown listeners remain here as they don't need R3F context.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState.isGameOver) return;
      const key = event.key.toLowerCase();
      if (key === "q") dispatch({ type: "CHANGE_FACE", payload: { direction: "left" } });
      else if (key === "e") dispatch({ type: "CHANGE_FACE", payload: { direction: "right" } });
      else if (key === "g") dispatch({ type: "TOGGLE_GHOST" });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, gameState.isGameOver]);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      {isGameOver && <GameOverOverlay dispatch={dispatch} />}
      <Canvas
        style={{ height: "100%", width: "100%", background: "#050505" }}
        camera={{ fov: 75 }}
        onCreated={({ camera }) => {
            // Set initial camera position. It will be managed by GameScene's useFrame.
            const halfWidth = BOARD_WIDTH / 2;
            const CAMERA_DISTANCE = 22;
            camera.position.set(0, 0, halfWidth + CAMERA_DISTANCE);
        }}
      >
        <GameScene gameState={gameState} />
      </Canvas>
    </div>
  );
};

export default GameBoard3D;