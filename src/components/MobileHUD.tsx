import { useAtom, useAtomValue } from "jotai";
import React from "react";
import useWindowSize from "../hooks/useWindowSize";
import {
  activeFaceAtom,
  isGameStartedAtom,
  isHudOpenAtom,
  levelAtom,
  scoreAtom,
} from "../atoms/gameAtoms";
import KeyHints from "./KeyHints";
import "./MobileUI.css";
import NextBlockPreview from "./NextBlockPreview";


const MobileHUD: React.FC = () => {
  const { width } = useWindowSize();
  const isGameStarted = useAtomValue(isGameStartedAtom);
  const [isHudOpen, setIsHudOpen] = useAtom(isHudOpenAtom);
  const score = useAtomValue(scoreAtom);
  const level = useAtomValue(levelAtom);
  const activeFace = useAtomValue(activeFaceAtom);

  const toggleHud = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsHudOpen(!isHudOpen);
  };

  const isDesktop = width >= 1024;

  if (!isGameStarted || isDesktop) {
    return null;
  }

  return (
    <div className="mobile-hud">
      <button
        className="hud-toggle-button"
        onTouchStart={toggleHud}
        onClick={toggleHud}
      >
        {isHudOpen ? "X" : "i"}
      </button>
      {isHudOpen && (
        <div className="hud-content">
          <p>Score: {score}</p>
          <p>Level: {level}</p>
          <p>Face: {activeFace}</p>
          <NextBlockPreview />
          <div className="desktop-only-hints" style={{marginTop: '15px'}}>
            <KeyHints />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHUD;