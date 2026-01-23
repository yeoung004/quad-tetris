import { useSetAtom } from "jotai";
import { isGameStartedAtom, startGameAtom } from "../atoms/gameAtoms";
import { useEffect, useState, useCallback } from "react";
import InstructionOverlay from "./InstructionOverlay";
import { useIsMobile } from "../hooks/useIsMobile"; // Import the custom hook

const StartScreen = () => {
  const startGame = useSetAtom(startGameAtom);
  const setIsGameStarted = useSetAtom(isGameStartedAtom);
  const isMobile = useIsMobile(); // Use the custom hook
  const [showInstructions, setShowInstructions] = useState(false); // State for overlay

  const handleStart = useCallback(() => {
    setIsGameStarted(true);
    startGame();
  }, [setIsGameStarted, startGame]);

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
          {isMobile ? "TOUCH SCREEN TO RESTART" : "PRESS SPACE TO RESTART"}
        </p>
      </div>

      {/* Help Button */}
      <div
        style={{
          position: "absolute",
          top: "2rem",
          right: "2rem",
          zIndex: 101, // Higher z-index to be on top of the start screen
          cursor: "pointer",
          fontSize: "2rem",
          color: "#fff",
          textShadow: "0 0 5px #0ff",
        }}
        onClick={toggleInstructions}
        onTouchStart={toggleInstructions}
      >
        ?
      </div>

      {/* Instructions Overlay */}
      {showInstructions && <InstructionOverlay onClose={() => setShowInstructions(false)} />}
    </>
  );
};

export default StartScreen;
