import { useAtom, useAtomValue } from "jotai";
import React from "react";
import {
  activeFaceAtom,
  isHudOpenAtom,
  levelAtom,
  nextBlockAtom,
  scoreAtom,
} from "../atoms/gameAtoms";
import KeyHints from "./KeyHints";
import "./MobileUI.css";
import { Canvas } from "@react-three/fiber";
import { Box, Edges } from "@react-three/drei";
import { TETROMINOS } from "../engine/TetrisBlock";

// This is the 3D preview, adapted from GameBoard3D.tsx to live inside the HUD
const NextBlockPreview: React.FC = () => {
    const nextBlock = useAtomValue(nextBlockAtom);
    if (!nextBlock) return null;

    const previewContainerStyle: React.CSSProperties = {
        width: "100%",
        height: "120px",
        background: "rgba(0,0,0,0.25)",
        borderRadius: "5px",
        marginTop: '10px',
    };
    
    const shape = nextBlock.shape;
    const shapeWidth = shape[0]?.length ?? 0;
    const shapeHeight = shape.length;
    const offsetX = (4 - shapeWidth) / 2;
    const offsetY = (4 - shapeHeight) / 2;

    return (
        <div>
            <p style={{marginBottom: '5px'}}>Next:</p>
            <div style={previewContainerStyle}>
                <Canvas camera={{ fov: 30, position: [0, 0, 10] }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} intensity={0.5} />
                <group scale={[0.8, 0.8, 0.8]}>
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
                                color={TETROMINOS[nextBlock.type].color}
                                emissive={TETROMINOS[nextBlock.type].color}
                                emissiveIntensity={0.4}
                                toneMapped={false}
                            />
                            <Edges color={TETROMINOS[nextBlock.type].color} />
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


const MobileHUD: React.FC = () => {
  const [isHudOpen, setIsHudOpen] = useAtom(isHudOpenAtom);
  const score = useAtomValue(scoreAtom);
  const level = useAtomValue(levelAtom);
  const activeFace = useAtomValue(activeFaceAtom);

  const toggleHud = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsHudOpen(!isHudOpen);
  };

  return (
    <div className="mobile-hud">
      <button
        className="hud-toggle-button"
        onTouchStart={toggleHud}
        onClick={toggleHud}
      >
        {isHudOpen ? "X" : "i"}
      </button>
      {isHudOpen && (
        <div className="hud-content">
          <p>Score: {score}</p>
          <p>Level: {level}</p>
          <p>Face: {activeFace}</p>
          <NextBlockPreview />
          <div className="desktop-only-hints" style={{marginTop: '15px'}}>
            <KeyHints />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHUD;