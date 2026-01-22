import { useSetAtom, useAtomValue } from "jotai";
import { changeFaceAtom, isGameStartedAtom } from "../atoms/gameAtoms";
import useWindowSize from "../hooks/useWindowSize";
import "./MobileUI.css";

const MobileControls = () => {
  const { width } = useWindowSize();
  const isGameStarted = useAtomValue(isGameStartedAtom);
  const changeFace = useSetAtom(changeFaceAtom);

  const isDesktop = width >= 1024;

  if (!isGameStarted || isDesktop) {
    return null;
  }

  const handleFaceChange = (e: React.TouchEvent | React.MouseEvent, direction: "left" | "right") => {
    e.preventDefault(); // Prevent zoom or other unwanted interactions
    e.stopPropagation(); // Stop event from bubbling up to the start screen handler
    changeFace(direction);
  }

  return (
    <>
      <div
        className="face-shift-button left"
        onTouchStart={(e) => handleFaceChange(e, "left")}
        onClick={(e) => handleFaceChange(e, "left")}
      />
      <div
        className="face-shift-button right"
        onTouchStart={(e) => handleFaceChange(e, "right")}
        onClick={(e) => handleFaceChange(e, "right")}
      />
    </>
  );
};

export default MobileControls;
