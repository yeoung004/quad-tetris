import { useAtomValue } from "jotai";
import React from "react";
import { isGameStartedAtom } from "./atoms/gameAtoms";
import GameBoard3D from "./components/GameBoard3D";
import GameController from "./components/GameController";
import MobileHUD from "./components/MobileHUD";
import StartScreen from "./components/StartScreen";
import "./components/MobileUI.css";

const App: React.FC = () => {
  const isGameStarted = useAtomValue(isGameStartedAtom);

  return (
    <div style={{ background: "#222", width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      {!isGameStarted ? (
        <StartScreen />
      ) : (
        <>
          {/* GameController is a non-rendering component that handles game logic */}
          <GameController />

          <MobileHUD />
          <GameBoard3D />
        </>
      )}
    </div>
  );
};

export default App;
