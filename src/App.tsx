import { useAtomValue, useSetAtom } from "jotai";
import React from "react";
import { isGameStartedAtom, isGameOverAtom, startGameAtom } from "./atoms/gameAtoms";
import GameBoard3D from "./components/GameBoard3D";
import GameController from "./components/GameController";
import MobileControls from "./components/MobileControls";
import MobileHUD from "./components/MobileHUD";
import { MobileSettingsHUD } from "./components/MobileSettingsHUD";
import StartScreen from "./components/StartScreen";
import DesktopDashboard from "./components/DesktopDashboard";
import GameOverUI from "./components/GameOverUI"; // Import GameOverUI
import "./components/MobileUI.css";
import "./components/DesktopDashboard.css";


const App: React.FC = () => {
  const isGameStarted = useAtomValue(isGameStartedAtom);
  const isGameOver = useAtomValue(isGameOverAtom); // Get game over state
  const startGame = useSetAtom(startGameAtom); // Get startGame action

  const handleRestart = () => {
    startGame();
  };

  return (
    <div style={{ background: "#222", width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      {!isGameStarted ? (
        <StartScreen />
      ) : isGameOver ? ( // If game is started and over, show GameOverUI
        <GameOverUI onRestart={handleRestart} />
      ) : (
        <>
          {/* GameController is a non-rendering component that handles game logic */}
          <GameController />

          <MobileHUD />
          <MobileControls />
          <MobileSettingsHUD />
          <DesktopDashboard />
          <GameBoard3D />
        </>
      )}
    </div>
  );
};

export default App;
