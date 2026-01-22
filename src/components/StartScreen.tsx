import { useSetAtom } from "jotai";
import { isGameStartedAtom, startGameAtom } from "../atoms/gameAtoms";
import { useEffect, useState } from "react";

const StartScreen = () => {
  const startGame = useSetAtom(startGameAtom);
  const setIsGameStarted = useSetAtom(isGameStartedAtom);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check for touch capabilities
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);

    const handleStart = (e: Event) => {
      // Prevent space from scrolling the page
      if (e instanceof KeyboardEvent && e.code === "Space") {
        e.preventDefault();
      }
      setIsGameStarted(true);
      startGame();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        handleStart(e);
      }
    };

    // Add listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleStart, { once: true });
    window.addEventListener("click", handleStart, { once: true });

    // Cleanup listeners
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("click", handleStart);
    };
  }, [setIsGameStarted, startGame]);

  return (
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
        zIndex: 100,
        cursor: "pointer",
        fontFamily: "'Orbitron', sans-serif",
      }}
    >
      <h1 style={{ fontSize: "3rem", textShadow: "0 0 10px #0ff" }}>
        3D TETRIS
      </h1>
      <p style={{ fontSize: "1.5rem", marginTop: "1rem" }}>
        {isTouchDevice ? "Touch to START" : "Press SPACE to START"}
      </p>
    </div>
  );
};

export default StartScreen;
