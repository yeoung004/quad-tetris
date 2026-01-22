import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect } from "react";
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
import { trackEvent } from './utils/analytics'; // Import trackEvent

const App: React.FC = () => {
  const isGameStarted = useAtomValue(isGameStartedAtom);
  const isGameOver = useAtomValue(isGameOverAtom); // Get game over state
  const startGame = useSetAtom(startGameAtom); // Get startGame action

  const handleRestart = () => {
    startGame();
    trackEvent('game_start'); // Track game_start on restart
  };

  useEffect(() => {
    if (isGameStarted && !isGameOver) {
      trackEvent('game_start'); // Track initial game_start
    }
  }, [isGameStarted, isGameOver]);

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
