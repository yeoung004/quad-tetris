import { atom } from "jotai";
import { TetrisBlock, TetrominoKey, TETROMINOS } from "../engine/TetrisBlock";
import {
  createEmptyGrid,
  GRID_HEIGHT,
  GRID_WIDTH,
  isValidMove,
} from "../engine/grid";
import { GameState } from "../types";

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
export const gameOverMessageAtom = atom('GAME OVER');
export const myFacesAtom = atom<number[]>([0, 1, 2, 3]);
export const showGhostAtom = atom(true);
export const levelAtom = atom(1);
export const linesClearedAtom = atom(0);
export const isLockingAtom = atom(false);
export const isFocusModeAtom = atom(false);

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
  })
);

// --- Writable Action Atoms ---

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
  set(isGameOverAtom, false);
  set(levelAtom, 1);
  set(linesClearedAtom, 0);
  set(isLockingAtom, false);
  set(gameOverMessageAtom, 'GAME OVER');
});

export const moveBlockAtom = atom(
  null,
  (get, set, { dx, dy }: { dx: number; dy: number }) => {
    const currentBlock = get(currentBlockAtom);
    if (get(isGameOverAtom) || !currentBlock) return;

    const newPos = {
      x: currentBlock.position.x + dx,
      y: currentBlock.position.y + dy,
    };

    if (isValidMove(get(currentGridAtom), currentBlock, newPos)) {
      const newBlock = new TetrisBlock(currentBlock.type);
      newBlock.position = newPos;
      newBlock.shape = currentBlock.shape;
      set(currentBlockAtom, newBlock);
      set(isLockingAtom, false);
    } else if (dy === 1) {
      set(isLockingAtom, true);
    }
  }
);

export const rotateBlockAtom = atom(null, (get, set) => {
  const currentBlock = get(currentBlockAtom);
  if (get(isGameOverAtom) || !currentBlock) return;

  const rotatedBlock = new TetrisBlock(currentBlock.type);
  rotatedBlock.position = currentBlock.position;
  rotatedBlock.shape = [...currentBlock.shape];
  rotatedBlock.rotate();

  if (isValidMove(get(currentGridAtom), rotatedBlock, rotatedBlock.position)) {
    set(currentBlockAtom, rotatedBlock);
    set(isLockingAtom, false);
  }
});

export const changeFaceAtom = atom(
  null,
  (get, set, direction: "left" | "right") => {
    const isGameOver = get(isGameOverAtom);
    const currentBlock = get(currentBlockAtom);
    if (isGameOver || !currentBlock) return;

    const myFaces = get(myFacesAtom);
    const activeFace = get(activeFaceAtom);
    let currentIndex = myFaces.indexOf(activeFace);

    if (direction === "right") {
      currentIndex = (currentIndex + 1) % myFaces.length;
    } else {
      currentIndex = (currentIndex - 1 + myFaces.length) % myFaces.length;
    }
    const newActiveFace = myFaces[currentIndex];
    const newGrid = get(gridsAtom)[newActiveFace];

    if (!isValidMove(newGrid, currentBlock, currentBlock.position)) {
      set(isGameOverAtom, true);
      set(gameOverMessageAtom, 'COLLISION!');
      // We might want to set the block to null to make the collision more visible
      set(currentBlockAtom, null); 
      return; // Stop execution to prevent face change
    }

    set(activeFaceAtom, newActiveFace);
  }
);

export const placeBlockAtom = atom(null, (get, set) => {
  const currentBlock = get(currentBlockAtom);
  if (!currentBlock) return;

  const activeFace = get(activeFaceAtom);
  const grids = get(gridsAtom);
  const { x: blockX, y: blockY } = currentBlock.position;

  const newGrid = grids[activeFace].map((row) => [...row]);

  currentBlock.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== 0) {
        const gridX = blockX + x;
        const gridY = blockY + y;
        if (
          gridY >= 0 &&
          gridY < GRID_HEIGHT &&
          gridX >= 0 &&
          gridX < GRID_WIDTH
        ) {
          newGrid[gridY][gridX] = currentBlock.type;
        }
      }
    });
  });

  const newGrids = [...grids];
  newGrids[activeFace] = newGrid;

  // Line clear logic
  let numLinesCleared = 0;
  for (let y = 0; y < GRID_HEIGHT; y++) {
    if (newGrids.every((grid) => grid[y].every((cell) => cell !== 0))) {
      numLinesCleared++;
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
  }

  const newCurrentBlock = get(nextBlockAtom) ?? spawnNewBlock();
  set(currentBlockAtom, new TetrisBlock(newCurrentBlock.type));
  set(nextBlockAtom, spawnNewBlock());
  set(isLockingAtom, false);

  if (
    !isValidMove(
      get(currentGridAtom),
      get(currentBlockAtom)!,
      get(currentBlockAtom)!.position
    )
  ) {
    set(isGameOverAtom, true);
    set(gameOverMessageAtom, 'GAME OVER');
    set(currentBlockAtom, null);
  }
});

export const dropBlockAtom = atom(null, (get, set) => {
  const currentBlock = get(currentBlockAtom);
  if (get(isGameOverAtom) || !currentBlock) return;

  const grid = get(currentGridAtom);
  let newY = currentBlock.position.y;
  while (
    isValidMove(grid, currentBlock, { x: currentBlock.position.x, y: newY + 1 })
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
  set(showGhostAtom, !get(showGhostAtom));
});

export const toggleFocusModeAtom = atom(null, (_get, set) => {
  set(isFocusModeAtom, (prev) => !prev);
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
