import { useAtomValue } from "jotai";
import React from "react";
import {
  nextBlockAtom,
} from "../atoms/gameAtoms";
import { Canvas } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
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
                            <mesh
                            key={`${y}-${x}`}
                            position={[x + offsetX - 1.5, -(y + offsetY) + 1.5, 0]}
                            >
                              <boxGeometry args={[1, 1, 1]} />
                            <meshStandardMaterial
                                color={TETROMINOS[nextBlock.type].color}
                                emissive={TETROMINOS[nextBlock.type].color}
                                emissiveIntensity={0.4}
                                toneMapped={false}
                            />
                            <Edges color={TETROMINOS[nextBlock.type].color} />
                            </mesh>
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

export default NextBlockPreview;
