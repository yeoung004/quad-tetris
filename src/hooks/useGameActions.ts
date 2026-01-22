import { useSetAtom } from "jotai";
import { useRef } from "react";
import {
  isFastDroppingAtom,
  moveBlockAtom,
  rotateBlockAtom,
  dropBlockAtom,
} from "../atoms/gameAtoms";

const LONG_PRESS_DURATION = 200; // ms
const SWIPE_THRESHOLD = 30; // pixels
const TAP_MAX_DURATION = 250; //ms
const TAP_MAX_MOVEMENT = 20; // pixels

export const useGameActions = () => {
  const moveBlock = useSetAtom(moveBlockAtom);
  const rotateBlock = useSetAtom(rotateBlockAtom);
  const dropBlock = useSetAtom(dropBlockAtom);
  const setIsFastDropping = useSetAtom(isFastDroppingAtom);

  const touchState = useRef<{
    startTime: number;
    startX: number;
    startY: number;
    longPressTimer: number | null;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 1) return;
    const { clientX, clientY } = e.touches[0];

    touchState.current = {
      startTime: Date.now(),
      startX: clientX,
      startY: clientY,
      longPressTimer: window.setTimeout(() => {
        if (touchState.current) {
          // Long press detected
          setIsFastDropping(true);
          touchState.current.longPressTimer = null; // Timer fired
        }
      }, LONG_PRESS_DURATION),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchState.current || e.changedTouches.length > 1) return;
    
    const { startTime, startX, startY, longPressTimer } = touchState.current;

    // Clear long press timer if it hasn't fired yet
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    // Always stop fast drop on touch end
    setIsFastDropping(false);

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now(),
    };

    const deltaX = touchEnd.x - startX;
    const deltaY = touchEnd.y - startY;
    const deltaTime = touchEnd.time - startTime;
    
    // If it was a long press, we don't do anything else.
    // The fast drop is already stopped.
    if (deltaTime >= LONG_PRESS_DURATION) {
      touchState.current = null;
      return;
    }

    // TAP LOGIC for rotation
    if (deltaTime < TAP_MAX_DURATION && Math.abs(deltaX) < TAP_MAX_MOVEMENT && Math.abs(deltaY) < TAP_MAX_MOVEMENT) {
      rotateBlock();
      touchState.current = null;
      return;
    }
    
    // SWIPE LOGIC
    // If it's not a tap and wasn't a long press, treat as a swipe.
    if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
      if (deltaX > SWIPE_THRESHOLD) {
        moveBlock({ dx: 1, dy: 0 }); // Right
      } else if (deltaX < -SWIPE_THRESHOLD) {
        moveBlock({ dx: -1, dy: 0 }); // Left
      }
    } else { // Vertical swipe
      if (deltaY > SWIPE_THRESHOLD) {
        dropBlock(); // Hard Drop on swipe down
      }
    }

    touchState.current = null;
  };

  return {
    handleTouchStart,
    handleTouchEnd,
  };
};