import { atom } from "jotai";
import { TetrisBlock, TetrominoKey, TETROMINOS } from "../engine/TetrisBlock";
import {
  createEmptyGrid,
  GRID_HEIGHT,
  GRID_WIDTH,
  isValidMove,
} from "../engine/grid";
import { GameState } from "../types";
import { trackEvent } from '../utils/analytics';

// --- Helper Functions ---

const POINTS_PER_LINE = 100;
const LINES_PER_LEVEL = 10;

const spawnNewBlock = () => {
  const tetrominoKeys = Object.keys(TETROMINOS).filter(
    (key) => key !== "0"
  ) as TetrominoKey[];
  const randomType =
    tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];
  return new TetrisBlock(randomType);
};

// --- Primitive State Atoms ---

export const gridsAtom = atom<(string | number)[][][]>([
  createEmptyGrid(),
  createEmptyGrid(),
  createEmptyGrid(),
  createEmptyGrid(),
]);
export const activeFaceAtom = atom(0);
export const currentBlockAtom = atom<TetrisBlock | null>(null);
export const nextBlockAtom = atom<TetrisBlock | null>(null);
export const scoreAtom = atom(0);
export const isGameOverAtom = atom(false);
export const gameOverMessageAtom = atom("GAME OVER");
export const myFacesAtom = atom<number[]>([0, 1, 2, 3]);
export const showGhostAtom = atom(true);
export const levelAtom = atom(1);
export const linesClearedAtom = atom(0);
export const isLockingAtom = atom(false);
export const isFocusModeAtom = atom(false);
export const isWarningAtom = atom(false);
export const isInputLockedAtom = atom(false);
export const collisionBlockAtom = atom<TetrisBlock | null>(null);

export const isGameStartedAtom = atom(false);
export const isInfoOpenAtom = atom(false);
export const isHudOpenAtom = atom(false);
export const isFastDroppingAtom = atom(false);

// --- Derived Read-only Atoms ---

export const currentGridAtom = atom((get) => {
  const grids = get(gridsAtom);
  const activeFace = get(activeFaceAtom);
  return grids[activeFace];
});

export const gameStateAtom = atom(
  (get): GameState => ({
    grids: get(gridsAtom),
    activeFace: get(activeFaceAtom),
    currentBlock: get(currentBlockAtom),
    nextBlock: get(nextBlockAtom),
    score: get(scoreAtom),
    isGameOver: get(isGameOverAtom),
    myFaces: get(myFacesAtom),
    showGhost: get(showGhostAtom),
    level: get(levelAtom),
    linesCleared: get(linesClearedAtom),
    isLocking: get(isLockingAtom),
    isFocusMode: get(isFocusModeAtom),
    isWarning: get(isWarningAtom),
    collisionBlock: get(collisionBlockAtom),
  })
);

// --- Writable Action Atoms ---

export const triggerCollisionWarningAtom = atom(
  null,
  (get, set, block: TetrisBlock) => {
    if (get(isWarningAtom) || get(isGameOverAtom)) return;

    set(isInputLockedAtom, true);
    set(collisionBlockAtom, block);
    set(isWarningAtom, true);
    set(gameOverMessageAtom, "GAME OVER"); // Message is now consistent

    setTimeout(() => {
      set(isGameOverAtom, true);
      set(isWarningAtom, false);
      set(isInputLockedAtom, false);
      set(currentBlockAtom, null);
      trackEvent('game_over', { score: get(scoreAtom), level: get(levelAtom) }); // Track game over
    }, 800);
  }
);

export const startGameAtom = atom(null, (_get, set) => {
  set(gridsAtom, [
    createEmptyGrid(),
    createEmptyGrid(),
    createEmptyGrid(),
    createEmptyGrid(),
  ]);
  set(activeFaceAtom, 0);
  set(currentBlockAtom, spawnNewBlock());
  set(nextBlockAtom, spawnNewBlock());
  set(scoreAtom, 0);
  set(isGameOverAtom, false); // Ensure game over is reset
  set(isGameStartedAtom, true); // Ensure game started is set to true
  set(levelAtom, 1);
  set(linesClearedAtom, 0);
  set(isLockingAtom, false);
  set(isWarningAtom, false);
  set(isInputLockedAtom, false);
  set(collisionBlockAtom, null);
  set(gameOverMessageAtom, "GAME OVER");
});

export const moveBlockAtom = atom(
  null,
  (get, set, { dx, dy }: { dx: number; dy: number }) => {
    const currentBlock = get(currentBlockAtom);
    const isGameOver = get(isGameOverAtom);
    const isInputLocked = get(isInputLockedAtom);
    const grids = get(gridsAtom);
    const activeFace = get(activeFaceAtom);

    if (isGameOver || isInputLocked || !currentBlock) return;

    const newPos = {
      x: currentBlock.position.x + dx,
      y: currentBlock.position.y + dy,
    };

    const nextBlock = new TetrisBlock(currentBlock.type);
    nextBlock.position = newPos;
    nextBlock.shape = currentBlock.shape;
    
    // The core logic change is here. We now pass the whole world state to isValidMove.
    if (isValidMove(grids, activeFace, nextBlock, newPos)) {
      // If the move is valid, we might need to wrap the block and change face
      let newActiveFace = activeFace;
      if (newPos.x < 0) {
        // Moved past the left edge
        newActiveFace = (activeFace - 1 + 4) % 4;
        nextBlock.position.x = GRID_WIDTH + newPos.x;
      } else if (newPos.x >= GRID_WIDTH) {
        // Moved past the right edge
        newActiveFace = (activeFace + 1) % 4;
        nextBlock.position.x = newPos.x - GRID_WIDTH;
      }

      set(currentBlockAtom, nextBlock);
      if (newActiveFace !== activeFace) {
        set(activeFaceAtom, newActiveFace);
      }
      set(isLockingAtom, false);
    } else if (dy === 1) {
      // If it's an invalid downward move, lock the piece.
      set(isLockingAtom, true);
    }
  }
);

export const rotateBlockAtom = atom(null, (get, set) => {
  const currentBlock = get(currentBlockAtom);
  const grids = get(gridsAtom);
  const activeFace = get(activeFaceAtom);

  if (get(isGameOverAtom) || get(isInputLockedAtom) || !currentBlock) return;

  const rotatedBlock = new TetrisBlock(currentBlock.type);
  rotatedBlock.shape = currentBlock.shape; // Start with current shape
  rotatedBlock.rotate(); // Rotate the shape
  rotatedBlock.position = currentBlock.position; // Keep original position for now

  // Test wall kicks (standard Tetris behavior)
  const testPositions = [
    rotatedBlock.position, // 0: No kick
    { x: rotatedBlock.position.x - 1, y: rotatedBlock.position.y }, // 1: Kick left
    { x: rotatedBlock.position.x + 1, y: rotatedBlock.position.y }, // 2: Kick right
    { x: rotatedBlock.position.x - 2, y: rotatedBlock.position.y }, // 3: Kick left 2
    { x: rotatedBlock.position.x + 2, y: rotatedBlock.position.y }, // 4: Kick right 2
  ];

  for (const testPos of testPositions) {
    if (isValidMove(grids, activeFace, rotatedBlock, testPos)) {
      rotatedBlock.position = testPos; // It's a valid move, update position
      set(currentBlockAtom, rotatedBlock);
      set(isLockingAtom, false);
      return; // Found a valid rotation, exit
    }
  }
  // If no valid rotation was found after all kicks, do nothing.
});

export const changeFaceAtom = atom(
  null,
  (get, set, direction: "left" | "right") => {
    const currentBlock = get(currentBlockAtom);
    if (get(isGameOverAtom) || get(isInputLockedAtom) || !currentBlock) return;

    const myFaces = get(myFacesAtom);
    const activeFace = get(activeFaceAtom);
    let currentIndex = myFaces.indexOf(activeFace);

    if (direction === "right") {
      currentIndex = (currentIndex + 1) % myFaces.length;
    } else {
      currentIndex = (currentIndex - 1 + myFaces.length) % myFaces.length;
    }
    const newActiveFace = myFaces[currentIndex];

    // Validate the current block's position on the NEW face before committing.
    if (isValidMove(get(gridsAtom), newActiveFace, currentBlock, currentBlock.position)) {
      set(activeFaceAtom, newActiveFace);
      trackEvent('face_change', { face_index: newActiveFace });
    }
    // If the move is invalid, do nothing, preventing the face change.
  }
);

export const placeBlockAtom = atom(null, (get, set) => {
  const currentBlock = get(currentBlockAtom);
  if (!currentBlock) return;

  const activeFace = get(activeFaceAtom);
  const grids = get(gridsAtom);
  const { x: blockX, y: blockY } = currentBlock.position;

  // Create a mutable copy of all grids
  const newGrids = grids.map(grid => grid.map(row => [...row]));

  currentBlock.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== 0) {
        const gridY = blockY + y;
        const gridX = blockX + x;

        let targetFace = activeFace;
        let targetX = gridX;

        if (gridX < 0) {
          targetFace = (activeFace - 1 + 4) % 4;
          targetX = gridX + GRID_WIDTH;
        } else if (gridX >= GRID_WIDTH) {
          targetFace = (activeFace + 1) % 4;
          targetX = gridX - GRID_WIDTH;
        }

        if (
          gridY >= 0 &&
          gridY < GRID_HEIGHT &&
          targetX >= 0 &&
          targetX < GRID_WIDTH
        ) {
          newGrids[targetFace][gridY][targetX] = currentBlock.type;
        }
      }
    });
  });

  // Line clear logic (remains the same as it checks all faces)
  let numLinesCleared = 0;
  for (let y = 0; y < GRID_HEIGHT; y++) {
    // Check if the line is full on ALL faces
    if (newGrids.every((grid) => grid[y].every((cell) => cell !== 0))) {
      numLinesCleared++;
      // If so, clear the line from ALL faces
      for (let i = 0; i < newGrids.length; i++) {
        newGrids[i].splice(y, 1);
        newGrids[i].unshift(Array(GRID_WIDTH).fill(0));
      }
    }
  }

  set(gridsAtom, newGrids);

  if (numLinesCleared > 0) {
    const newTotalLinesCleared = get(linesClearedAtom) + numLinesCleared;
    set(linesClearedAtom, newTotalLinesCleared);
    set(
      scoreAtom,
      get(scoreAtom) + numLinesCleared * POINTS_PER_LINE * numLinesCleared
    );
    set(levelAtom, Math.floor(newTotalLinesCleared / LINES_PER_LEVEL) + 1);
     trackEvent('line_clear', { lines: numLinesCleared, level: get(levelAtom) });
  }

  // Spawn new block
  const newCurrentBlock = get(nextBlockAtom) ?? spawnNewBlock();
  set(currentBlockAtom, new TetrisBlock(newCurrentBlock.type));
  set(nextBlockAtom, spawnNewBlock());
  set(isLockingAtom, false);

  // Check for game over with the new block
  const freshCurrentBlock = get(currentBlockAtom)!;
  if (
    !isValidMove(
      get(gridsAtom),
      get(activeFaceAtom),
      freshCurrentBlock,
      freshCurrentBlock.position
    )
  ) {
    set(triggerCollisionWarningAtom, freshCurrentBlock);
  }
});

export const dropBlockAtom = atom(null, (get, set) => {
  const currentBlock = get(currentBlockAtom);
  if (get(isGameOverAtom) || !currentBlock) return;

  const grids = get(gridsAtom);
  const activeFace = get(activeFaceAtom);
  let newY = currentBlock.position.y;
  while (
    isValidMove(grids, activeFace, currentBlock, { x: currentBlock.position.x, y: newY + 1 })
  ) {
    newY++;
  }

  const newBlock = new TetrisBlock(currentBlock.type);
  newBlock.position = { x: currentBlock.position.x, y: newY };
  newBlock.shape = currentBlock.shape;

  set(currentBlockAtom, newBlock);
  set(placeBlockAtom); // placeBlockAtom is an action atom
});

export const toggleGhostAtom = atom(null, (get, set) => {
  const newState = !get(showGhostAtom);
  set(showGhostAtom, newState);
  trackEvent('setting_toggle', { setting_name: 'ghost_mode', enabled: newState });
});

export const toggleFocusModeAtom = atom(null, (_get, set) => {
  set(isFocusModeAtom, (prev) => {
    trackEvent('setting_toggle', { setting_name: 'focus_mode', enabled: !prev });
    return !prev;
  });
});

export const setFaceAssignmentsAtom = atom(
  null,
  (get, set, faces: number[]) => {
    set(myFacesAtom, faces);
    if (!faces.includes(get(activeFaceAtom))) {
      set(activeFaceAtom, faces[0] || 0);
    }
  }
);
