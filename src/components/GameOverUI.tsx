import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import HelpButton from "./HelpButton";
import "./HelpButton.css";
import InstructionOverlay from "./InstructionOverlay";

interface GameOverUIProps {
  onRestart: () => void;
}

const GameOverUI = ({ onRestart }: GameOverUIProps) => {
  const isMobile = useIsMobile();
  const [showInstructions, setShowInstructions] = useState(false);

  const handleRestart = () => {
    if (showInstructions) return;
    onRestart();
  };

  const toggleInstructions = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setShowInstructions(!showInstructions);
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          color: "white",
          zIndex: 99,
          cursor: "pointer",
          fontFamily: "'Orbitron', sans-serif",
        }}
        onClick={handleRestart}
      >
        <h1 style={{ fontSize: "3rem", textShadow: "0 0 10px #f00" }}>
          GAME OVER
        </h1>
        <p style={{ fontSize: "1.5rem", marginTop: "1rem" }}>
          {isMobile ? "TOUCH SCREEN TO RESTART" : "PRESS SPACE TO RESTART"}
        </p>
      </div>
      <HelpButton onClick={toggleInstructions} />

      {showInstructions && (
        <InstructionOverlay onClose={() => setShowInstructions(false)} />
      )}
    </>
  );
};

export default GameOverUI;
