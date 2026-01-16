import React from "react";
import { useAtomValue } from "jotai";
import GameBoard3D from "./components/GameBoard3D";
import KeyHints from "./components/KeyHints";
import GameController from "./components/GameController";
import {
  scoreAtom,
  levelAtom,
  linesClearedAtom,
  activeFaceAtom,
} from "./atoms/gameAtoms";

const App: React.FC = () => {
  const score = useAtomValue(scoreAtom);
  const level = useAtomValue(levelAtom);
  const linesCleared = useAtomValue(linesClearedAtom);
  const activeFace = useAtomValue(activeFaceAtom);

  const infoStyles: React.CSSProperties = {
    position: "absolute",
    top: "20px",
    left: "20px",
    zIndex: 100,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "white",
    padding: "15px",
    borderRadius: "10px",
    fontFamily: "monospace",
    fontSize: "18px",
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#222" }}>
      {/* GameController is a non-rendering component that handles game logic */}
      <GameController />

      <div style={infoStyles}>
        <p>Score: {score}</p>
        <p>Level: {level}</p>
        <p>Lines: {linesCleared}</p>
        <p>Face: {activeFace}</p>
      </div>
      <KeyHints />
      <GameBoard3D />
    </div>
  );
};

export default App;
