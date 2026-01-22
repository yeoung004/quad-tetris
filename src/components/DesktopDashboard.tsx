import { useAtomValue } from "jotai";
import React from "react";
import useWindowSize from "../hooks/useWindowSize";
import {
  activeFaceAtom,
  isGameStartedAtom,
  levelAtom,
  scoreAtom,
} from "../atoms/gameAtoms";
import KeyHints from "./KeyHints";
import NextBlockPreview from "./NextBlockPreview";
import "./DesktopDashboard.css";

const DesktopDashboard: React.FC = () => {
  const { width } = useWindowSize();
  const isGameStarted = useAtomValue(isGameStartedAtom);
  const score = useAtomValue(scoreAtom);
  const level = useAtomValue(levelAtom);
  const activeFace = useAtomValue(activeFaceAtom);

  const isDesktop = width >= 1024;

  if (!isDesktop || !isGameStarted) {
    return null;
  }

  return (
    <>
      <div className="desktop-dashboard left">
        <div className="dashboard-panel">
          <h2>Stats</h2>
          <p>Score: {score}</p>
          <p>Level: {level}</p>
          <p>Face: {activeFace}</p>
        </div>
      </div>
      <div className="desktop-dashboard right">
        <div className="dashboard-panel">
          <h2>Next</h2>
          <NextBlockPreview />
        </div>
        <div className="dashboard-panel">
            <h2>Controls</h2>
            <KeyHints />
        </div>
      </div>
    </>
  );
};

export default DesktopDashboard;
