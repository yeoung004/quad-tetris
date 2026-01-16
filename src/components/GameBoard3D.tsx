import { Box, Edges, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  GameAction,
  GameState,
  GRID_HEIGHT,
  GRID_WIDTH,
} from "../engine/gameReducer";
import { TETROMINOS } from "../engine/TetrisBlock";

type GameBoard3DProps = {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
};

const BLOCK_SIZE = 1;
const BOARD_WIDTH = GRID_WIDTH * BLOCK_SIZE;
const BOARD_HEIGHT = GRID_HEIGHT * BLOCK_SIZE;

// [Art Director] 추가: 게임판의 전체 경계를 시각화하는 컴포넌트
const GameBoardBoundary = () => {
  return (
    <group>
      {/* 바닥면 가이드 - 블록이 착지하는 지점을 강조 */}
      <mesh position={[0, -BOARD_HEIGHT / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BOARD_WIDTH, BOARD_WIDTH]} />
        <meshBasicMaterial color="#111111" transparent opacity={0.6} />
      </mesh>

      {/* 메인 보더 케이지 - 사이버펑크 네온 블루 테두리 */}
      <Box args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_WIDTH]}>
        <meshBasicMaterial transparent opacity={0.05} color="#00ffff" />
        <Edges threshold={15} color="#00ffff">
          <meshBasicMaterial color="#00ffff" toneMapped={false} />
        </Edges>
      </Box>

      {/* 내부 가로선 - 높이 체감을 돕는 가이드 라인 (선택 사항) */}
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
              (GRID_HEIGHT - y) * BLOCK_SIZE - BOARD_HEIGHT / 2 - BLOCK_SIZE / 2,
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
      minPolarAngle={Math.PI / 2}
      maxPolarAngle={Math.PI / 2}
    />
  );
};

const GameBoard3D: React.FC<GameBoard3DProps> = ({ gameState, dispatch }) => {
  const { grids, activeFace, currentBlock } = gameState;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState.isGameOver) return;
      const key = event.key.toLowerCase();
      if (key === "q") {
        dispatch({ type: "CHANGE_FACE", payload: { direction: "left" } });
      } else if (key === "e") {
        dispatch({ type: "CHANGE_FACE", payload: { direction: "right" } });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, gameState.isGameOver]);

  return (
    <Canvas
      style={{ height: "100vh", width: "100vw", background: "#050505" }}
      camera={{ position: [0, 0, 30], fov: 75 }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 20]} intensity={1} />

      <AnimatedCamera activeFace={activeFace} />

      <group>
        {/* [Senior Developer] Boundary 추가: 게임의 틀을 잡아줍니다. */}
        <GameBoardBoundary />

        {grids.map((grid, index) => (
          <GameBoardFace key={index} grid={grid} faceIndex={index} />
        ))}
        
        {currentBlock && (
          <group rotation={[0, activeFace * (Math.PI / 2), 0]}>
            {currentBlock.shape.map((row, y) =>
              row.map((cell, x) => {
                if (cell !== 0) {
                  const position = new THREE.Vector3(
                    (currentBlock.position.x + x) * BLOCK_SIZE - BOARD_WIDTH / 2 + BLOCK_SIZE / 2,
                    (GRID_HEIGHT - (currentBlock.position.y + y)) * BLOCK_SIZE - BOARD_HEIGHT / 2 - BLOCK_SIZE / 2,
                    BOARD_WIDTH / 2
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
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
      </EffectComposer>
    </Canvas>
  );
};

export default GameBoard3D;