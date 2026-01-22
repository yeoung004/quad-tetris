import React, { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import useWindowSize from "../hooks/useWindowSize";
import {
  isFocusModeAtom,
  showGhostAtom,
  toggleFocusModeAtom,
  toggleGhostAtom,
} from "../atoms/gameAtoms";
import "./MobileSettingsHUD.css";

const GearIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: "drop-shadow(0 0 5px #00ffff)" }} // 네온 글로우 효과
  >
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="#00ffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15L21.4 12L19.4 9M4.6 9L2.6 12L4.6 15M15 19.4L12 21.4L9 19.4M9 4.6L12 2.6L15 4.6M17.8 17.8L19.2 19.2M6.2 6.2L4.8 4.8M6.2 17.8L4.8 19.2M17.8 6.2L19.2 4.8"
      stroke="#00ffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ToggleSwitch = ({
  label,
  isChecked,
  onToggle,
}: {
  label: string;
  isChecked: boolean;
  onToggle: () => void;
}) => (
  <div className="setting-row">
    <label htmlFor={label}>{label}</label>
    <label className="switch">
      <input
        id={label}
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
      />
      <span className="slider"></span>
    </label>
  </div>
);

export const MobileSettingsHUD: React.FC = () => {
  const { width } = useWindowSize();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const isFocusMode = useAtomValue(isFocusModeAtom);
  const showGhost = useAtomValue(showGhostAtom);

  const toggleFocusMode = useSetAtom(toggleFocusModeAtom);
  const toggleGhost = useSetAtom(toggleGhostAtom);

  if (width >= 1024) {
    return null; // Don't render on desktop
  }

  return (
    <div className="settings-hud">
      <button
        className="settings-button"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <GearIcon />
      </button>

      {isMenuOpen && (
        <div className="settings-menu">
          <ToggleSwitch
            label="Focus Mode"
            isChecked={isFocusMode}
            onToggle={toggleFocusMode}
          />
          <ToggleSwitch
            label="Ghost Mode"
            isChecked={showGhost}
            onToggle={toggleGhost}
          />
        </div>
      )}
    </div>
  );
};
