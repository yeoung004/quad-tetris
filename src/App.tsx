import React, { useEffect, useReducer } from "react";
import GameBoard3D from "./components/GameBoard3D";
import KeyHints from "./components/KeyHints";
import { createEmptyGrid, gameReducer } from "./engine/gameReducer";

const App: React.FC = () => {
  const [gameState, dispatch] = useReducer(gameReducer, {
    grids: [
      createEmptyGrid(),
      createEmptyGrid(),
      createEmptyGrid(),
      createEmptyGrid(),
    ],
    activeFace: 0,
    currentBlock: null,
    nextBlock: null,
    score: 0,
    isGameOver: true, // Start in a non-playing state
    myFaces: [0, 1, 2, 3],
    showGhost: true,
    level: 1,
    linesCleared: 0,
    isLocking: false,
  });

  useEffect(() => {
    dispatch({ type: "START_GAME" });
  }, []);

  // Game Loop for block falling
  useEffect(() => {
    if (
      gameState.isGameOver ||
      !gameState.myFaces.includes(gameState.activeFace) ||
      gameState.isLocking
    ) {
      return;
    }

    const level = gameState.level;
    const delay = Math.max(
      100,
      1000 * Math.pow(0.8 - (level - 1) * 0.007, level - 1)
    );

    const gameInterval = setInterval(() => {
      dispatch({ type: "MOVE_BLOCK", payload: { dx: 0, dy: 1 } });
    }, delay);

    return () => clearInterval(gameInterval);
  }, [
    gameState.isGameOver,
    gameState.myFaces,
    gameState.activeFace,
    gameState.level,
    gameState.isLocking,
  ]);

  // Lock Delay Timer
  useEffect(() => {
    if (gameState.isLocking) {
      const lockTimeout = setTimeout(() => {
        dispatch({ type: "PLACE_BLOCK" });
      }, 500);

      return () => clearTimeout(lockTimeout);
    }
  }, [gameState.isLocking]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        gameState.isGameOver ||
        !gameState.myFaces.includes(gameState.activeFace)
      )
        return;

      switch (e.key) {
        case "ArrowLeft":
          dispatch({ type: "MOVE_BLOCK", payload: { dx: -1, dy: 0 } });
          break;
        case "ArrowRight":
          dispatch({ type: "MOVE_BLOCK", payload: { dx: 1, dy: 0 } });
          break;
        case "ArrowDown":
          dispatch({ type: "MOVE_BLOCK", payload: { dx: 0, dy: 1 } });
          break;
        case "ArrowUp":
          dispatch({ type: "ROTATE_BLOCK" });
          break;
        case " ": // Space bar
          dispatch({ type: "DROP_BLOCK" });
          break;
        case "q":
          dispatch({ type: "CHANGE_FACE", payload: { direction: "left" } });
          break;
        case "e":
          dispatch({ type: "CHANGE_FACE", payload: { direction: "right" } });
          break;
        case "g":
          dispatch({ type: "TOGGLE_GHOST" });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState.isGameOver, gameState.myFaces, gameState.activeFace]);

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
      <div style={infoStyles}>
        <p>Score: {gameState.score}</p>
        <p>Level: {gameState.level}</p>
        <p>Lines: {gameState.linesCleared}</p>
        <p>Face: {gameState.activeFace}</p>
      </div>
      <KeyHints />
      <GameBoard3D gameState={gameState} dispatch={dispatch} />
    </div>
  );
};

export default App;
