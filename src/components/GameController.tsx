import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  isGameOverAtom,
  isInputLockedAtom,
  myFacesAtom,
  activeFaceAtom,
  levelAtom,
  isLockingAtom,
  startGameAtom,
  moveBlockAtom,
  rotateBlockAtom,
  changeFaceAtom,
  dropBlockAtom,
  placeBlockAtom,
  toggleGhostAtom,
  toggleFocusModeAtom,
} from "../atoms/gameAtoms";

// DAS (Delayed Auto Shift) and ARR (Auto Repeat Rate) parameters
const DAS_DELAY = 160; // ms
const ARR = 50; // ms

// This is a non-rendering component responsible for handling game logic,
// such as the game loop, keyboard inputs, and other side effects.
const GameController = () => {
  const startGame = useSetAtom(startGameAtom);
  const moveBlock = useSetAtom(moveBlockAtom);
  const rotateBlock = useSetAtom(rotateBlockAtom);
  const changeFace = useSetAtom(changeFaceAtom);
  const dropBlock = useSetAtom(dropBlockAtom);
  const placeBlock = useSetAtom(placeBlockAtom);
  const toggleGhost = useSetAtom(toggleGhostAtom);
  const toggleFocusMode = useSetAtom(toggleFocusModeAtom);

  const isGameOver = useAtomValue(isGameOverAtom);
  const isInputLocked = useAtomValue(isInputLockedAtom);
  const myFaces = useAtomValue(myFacesAtom);
  const activeFace = useAtomValue(activeFaceAtom);
  const level = useAtomValue(levelAtom);
  const isLocking = useAtomValue(isLockingAtom);

  // Refs to hold timer IDs for DAS and ARR
  const moveTimers = useRef<{
    [key: string]: { das?: number; arr?: number };
  }>({});

  // Start the game on mount
  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (isGameOver || isInputLocked || !myFaces.includes(activeFace)) {
      return;
    }
    const calculateDelay = (lvl: number) => {
      const startSpeed = 500;
      const step = 70;
      const minDelay = 60;
      return Math.max(minDelay, startSpeed - (lvl - 1) * step);
    };

    const currentDelay = calculateDelay(level);

    const gameInterval = setInterval(() => {
      moveBlock({ dx: 0, dy: 1 });
    }, currentDelay);
 
    return () => clearInterval(gameInterval);
  }, [isGameOver, isInputLocked, myFaces, activeFace, level, moveBlock]);

  // Lock Delay Timer
  useEffect(() => {
    if (isLocking) {
      const lockTimeout = setTimeout(() => {
        placeBlock();
      }, 100);

      return () => clearTimeout(lockTimeout);
    }
  }, [isLocking, placeBlock]);

  // Keyboard controls with DAS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Using event.code bypasses issues with IME (e.g., Korean input) and
      // makes the controls dependent on the physical key location.
      // The user's request to ignore `isComposing` is implicitly handled by this change.
      if (isInputLocked) return; // Lock all inputs during warning

      // Ignore all browser repeat events; we handle it ourselves.
      if (e.repeat) return;
      
      if (isGameOver && e.code !== "Space") return;
      if (
        !myFaces.includes(activeFace) &&
        !["KeyQ", "KeyE", "KeyF", "KeyG"].includes(e.code)
      ) {
        return;
      }

      const moveAction = (code: string) => {
        switch (code) {
          case "ArrowLeft":
            moveBlock({ dx: -1, dy: 0 });
            break;
          case "ArrowRight":
            moveBlock({ dx: 1, dy: 0 });
            break;
          case "ArrowDown":
            moveBlock({ dx: 0, dy: 1 }); // Soft Drop
            break;
        }
      };

      switch (e.code) {
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowDown":
          moveAction(e.code); // Initial move on first press
          const dasTimer = window.setTimeout(() => {
            // If key was released before the DAS timeout finished, do nothing.
            if (!moveTimers.current[e.code]) {
              return;
            }
            moveAction(e.code); // First move after DAS delay
            const arrTimer = window.setInterval(() => {
              moveAction(e.code); // Subsequent moves at ARR
            }, ARR);
            moveTimers.current[e.code].arr = arrTimer; // Store interval timer
          }, DAS_DELAY);
          moveTimers.current[e.code] = { das: dasTimer }; // Store timeout timer
          break;
        case "ArrowUp":
          rotateBlock();
          break;
        case "Space": // Space bar
          if (isGameOver) {
            startGame();
          } else {
            dropBlock();
          }
          break;
        case "KeyQ":
          changeFace("left");
          break;
        case "KeyE":
          changeFace("right");
          break;
        case "KeyG":
          toggleGhost();
          break;
        case "KeyF":
          toggleFocusMode();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowDown"].includes(e.code)) {
        if (moveTimers.current[e.code]) {
          if (moveTimers.current[e.code].das)
            window.clearTimeout(moveTimers.current[e.code].das!);
          if (moveTimers.current[e.code].arr)
            window.clearInterval(moveTimers.current[e.code].arr!);
          delete moveTimers.current[e.code];
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      // Clear all timers on unmount
      Object.keys(moveTimers.current).forEach((key) => {
        if (moveTimers.current[key]?.das)
          window.clearTimeout(moveTimers.current[key].das!);
        if (moveTimers.current[key]?.arr)
          window.clearInterval(moveTimers.current[key].arr!);
      });
    };
  }, [
    isGameOver,
    myFaces,
    activeFace,
    moveBlock,
    rotateBlock,
    changeFace,
    dropBlock,
    toggleGhost,
    toggleFocusMode,
    startGame,
  ]);

  return null; // This component does not render anything
};

export default GameController;
