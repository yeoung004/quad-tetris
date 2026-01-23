import { useSetAtom } from "jotai";
import { isGameStartedAtom, startGameAtom } from "../atoms/gameAtoms";
import { useEffect, useState, useCallback } from "react";
import InstructionOverlay from "./InstructionOverlay";
import { useIsMobile } from "../hooks/useIsMobile"; // Import the custom hook
import HelpButton from "./HelpButton";
import "./HelpButton.css";

const StartScreen = () => {
  const startGame = useSetAtom(startGameAtom);
  const setIsGameStarted = useSetAtom(isGameStartedAtom);
  const isMobile = useIsMobile(); // Use the custom hook
  const [showInstructions, setShowInstructions] = useState(false); // State for overlay

  const handleStart = useCallback(() => {
    if (showInstructions) return;
    setIsGameStarted(true);
    startGame();
  }, [setIsGameStarted, startGame, showInstructions]);

  const toggleInstructions = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Prevent the main container's click/touch handler
    setShowInstructions(!showInstructions);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !showInstructions) {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showInstructions, handleStart]); // Rerun if overlay state changes

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
          zIndex: 99, // Lower z-index for the main screen
          cursor: "pointer",
          fontFamily: "'Orbitron', sans-serif",
        }}
        onClick={handleStart}
      >
        <h1 style={{ fontSize: "3rem", textShadow: "0 0 10px #0ff" }}>
          3D TETRIS
        </h1>
        <p style={{ fontSize: "1.5rem", marginTop: "1rem" }}>
          {isMobile ? "TOUCH SCREEN TO START" : "PRESS SPACE TO START"}
        </p>
      </div>

      <HelpButton onClick={toggleInstructions} />

      {/* Instructions Overlay */}
      {showInstructions && <InstructionOverlay onClose={() => setShowInstructions(false)} />}
    </>
  );
};


export default StartScreen;
