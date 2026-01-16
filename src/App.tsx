import React, { useEffect, useReducer } from "react";
import GameBoard3D from "./components/GameBoard3D";
import KeyHints from "./components/KeyHints";
import { createEmptyGrid, gameReducer } from "./engine/gameReducer";
import { TetrisBlock } from "./engine/TetrisBlock";

const App: React.FC = () => {
  const [gameState, dispatch] = useReducer(gameReducer, {
    grids: [
      createEmptyGrid(),
      createEmptyGrid(),
      createEmptyGrid(),
      createEmptyGrid(),
    ],
    activeFace: 0,
    currentBlock: new TetrisBlock("I"),
    score: 0,
    isGameOver: false,
    myFaces: [0, 1, 2, 3],
    showGhost: true,
    nextBlock: new TetrisBlock("L"),
  });

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

  useEffect(() => {
    if (
      gameState.isGameOver ||
      !gameState.myFaces.includes(gameState.activeFace)
    )
      return;

    const gameInterval = setInterval(() => {
      dispatch({ type: "MOVE_BLOCK", payload: { dx: 0, dy: 1 } });
    }, 1000);

    return () => clearInterval(gameInterval);
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
        <p>Face: {gameState.activeFace}</p>
      </div>
      <KeyHints />
      <GameBoard3D gameState={gameState} dispatch={dispatch} />
    </div>
  );
};

export default App;
