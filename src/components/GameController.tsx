import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  isGameOverAtom,
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
  const myFaces = useAtomValue(myFacesAtom);
  const activeFace = useAtomValue(activeFaceAtom);
  const level = useAtomValue(levelAtom);
  const isLocking = useAtomValue(isLockingAtom);

  // Start the game on mount
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Game Loop for block falling
  useEffect(() => {
    if (isGameOver || !myFaces.includes(activeFace) || isLocking) {
      return;
    }

    const delay = Math.max(
      100,
      1000 * Math.pow(0.8 - (level - 1) * 0.007, level - 1)
    );

    const gameInterval = setInterval(() => {
      moveBlock({ dx: 0, dy: 1 });
    }, delay);

    return () => clearInterval(gameInterval);
  }, [isGameOver, myFaces, activeFace, level, isLocking, moveBlock]);

  // Lock Delay Timer
  useEffect(() => {
    if (isLocking) {
      const lockTimeout = setTimeout(() => {
        placeBlock();
      }, 500);

      return () => clearTimeout(lockTimeout);
    }
  }, [isLocking, placeBlock]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isGameOver && e.key !== ' ') return;
      if (!myFaces.includes(activeFace) && e.key !== 'q' && e.key !== 'e') return;


      switch (e.key) {
        case "ArrowLeft":
          moveBlock({ dx: -1, dy: 0 });
          break;
        case "ArrowRight":
          moveBlock({ dx: 1, dy: 0 });
          break;
        case "ArrowDown":
          moveBlock({ dx: 0, dy: 1 });
          break;
        case "ArrowUp":
          rotateBlock();
          break;
        case " ": // Space bar
          if (isGameOver) {
            startGame();
          } else {
            dropBlock();
          }
          break;
        case "q":
          changeFace("left");
          break;
        case "e":
          changeFace("right");
          break;
        case "g":
          toggleGhost();
          break;
        case "f":
          toggleFocusMode();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
