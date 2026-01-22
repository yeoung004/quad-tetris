import { useSetAtom, useAtomValue } from "jotai";
import { useRef } from "react";
import { changeFaceAtom, isGameStartedAtom } from "../atoms/gameAtoms";
import useWindowSize from "../hooks/useWindowSize";
import "./MobileUI.css";

const MobileControls = () => {
  const { width } = useWindowSize();
  const isGameStarted = useAtomValue(isGameStartedAtom);
  const changeFace = useSetAtom(changeFaceAtom);
  const lastTap = useRef(0);

  const isDesktop = width >= 1024;

  if (!isGameStarted || isDesktop) {
    return null;
  }

  const handleFaceChange = (e: React.TouchEvent | React.MouseEvent, direction: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    if (now - lastTap.current < 300) { // 300ms debounce
      return;
    }
    lastTap.current = now;

    changeFace(direction);
  }

  return (
    <>
      <div
        className="face-shift-button left"
        onTouchStart={(e) => handleFaceChange(e, "left")}
        onClick={(e) => handleFaceChange(e, "left")}
      >
        &lt;
      </div>
      <div
        className="face-shift-button right"
        onTouchStart={(e) => handleFaceChange(e, "right")}
        onClick={(e) => handleFaceChange(e, "right")}
      >
        &gt;
      </div>
    </>
  );
};

export default MobileControls;
