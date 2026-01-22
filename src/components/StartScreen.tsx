import { useSetAtom } from "jotai";
import { isGameStartedAtom, startGameAtom } from "../atoms/gameAtoms";
import { useEffect, useState } from "react";

const StartScreen = () => {
  const startGame = useSetAtom(startGameAtom);
  const setIsGameStarted = useSetAtom(isGameStartedAtom);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const handleStart = () => {
    setIsGameStarted(true);
    startGame();
  };

  useEffect(() => {
    // Basic check for touch capabilities
    const onTouch = () => {
      setIsTouchDevice(true);
      window.removeEventListener('touchstart', onTouch);
    };
    window.addEventListener('touchstart', onTouch);

    return () => {
      window.removeEventListener('touchstart', onTouch);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
      onClick={handleStart}
      onTouchStart={handleStart}
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
