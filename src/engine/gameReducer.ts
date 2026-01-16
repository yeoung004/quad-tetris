import { TetrisBlock, TETROMINOS, TetrominoKey } from './TetrisBlock';
import { checkMultiFaceLineClear } from './lineClear';

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;

export const createEmptyGrid = (): (string | number)[][] =>
  Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(0));

export type GameState = {
  grids: (string | number)[][][];
  activeFace: number;
  currentBlock: TetrisBlock | null;
  nextBlock: TetrisBlock | null;
  score: number;
  isGameOver: boolean;
  myFaces: number[];
  showGhost: boolean;
  level: number;
  linesCleared: number;
  isLocking: boolean;
};

export type GameAction =
  | { type: 'MOVE_BLOCK'; payload: { dx: number; dy: number } }
  | { type: 'ROTATE_BLOCK' }
  | { type: 'CHANGE_FACE'; payload: { direction: 'left' | 'right' } }
  | { type: 'DROP_BLOCK' }
  | { type: 'START_GAME' }
  | { type: 'SET_FACE_ASSIGNMENTS', payload: number[] }
  | { type: 'SET_STATE', payload: GameState }
  | { type: 'TOGGLE_GHOST' }
  | { type: 'PLACE_BLOCK' };

const initialState: GameState = {
  grids: [createEmptyGrid(), createEmptyGrid(), createEmptyGrid(), createEmptyGrid()],
  activeFace: 0,
  currentBlock: null,
  nextBlock: null,
  score: 0,
  isGameOver: false,
  myFaces: [0, 1, 2, 3],
  showGhost: true,
  level: 1,
  linesCleared: 0,
  isLocking: false,
};

export function isValidMove(
  grid: (string | number)[][],
  block: TetrisBlock,
  newPosition: { x: number; y: number }
): boolean {
  for (let y = 0; y < block.shape.length; y++) {
    for (let x = 0; x < block.shape[y].length; x++) {
      if (block.shape[y][x] !== 0) {
        const newX = newPosition.x + x;
        const newY = newPosition.y + y;

        if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT || (grid[newY] && grid[newY][newX] !== 0)) {
          return false;
        }
      }
    }
  }
  return true;
}

function spawnNewBlock(): TetrisBlock {
    const tetrominoKeys = Object.keys(TETROMINOS).filter(key => key !== '0') as TetrominoKey[];
    const randomType = tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];
    return new TetrisBlock(randomType);
}

function placeBlock(state: GameState): GameState {
  if (!state.currentBlock) return state;

  const { currentBlock, activeFace, grids } = state;
  const { x: blockX, y: blockY } = currentBlock.position;

  const newGrid = grids[activeFace].map(row => [...row]);

  currentBlock.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== 0) {
        const gridX = blockX + x;
        const gridY = blockY + y;
        if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
          newGrid[gridY][gridX] = currentBlock.type;
        }
      }
    });
  });

  const newGrids = [...grids];
  newGrids[activeFace] = newGrid;

  // Prepare for next block
  const nextBlock = state.nextBlock ? state.nextBlock : spawnNewBlock();
  
  // The new block starts at a standard position
  const newCurrentBlock = new TetrisBlock(nextBlock.type);
  newCurrentBlock.shape = nextBlock.shape;
  newCurrentBlock.position = { x: Math.floor(GRID_WIDTH / 2) - 1, y: 0 };


  const newState = {
    ...state,
    grids: newGrids,
    currentBlock: newCurrentBlock,
    nextBlock: spawnNewBlock(), // a completely new block for preview
  };

  // After setting the new block, check if it's in a valid position. If not, game over.
  if (!isValidMove(newState.grids[newState.activeFace], newState.currentBlock, newState.currentBlock.position)) {
    return { ...state, grids: newGrids, isGameOver: true, currentBlock: null };
  }

  return checkMultiFaceLineClear(newState);
}

export function gameReducer(state: GameState = initialState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
        return {
            ...initialState,
            grids: [createEmptyGrid(), createEmptyGrid(), createEmptyGrid(), createEmptyGrid()],
            currentBlock: spawnNewBlock(),
            nextBlock: spawnNewBlock(),
            isGameOver: false,
            score: 0,
            level: 1,
            linesCleared: 0,
        };
    
    case 'SET_STATE':
        return action.payload;

    case 'TOGGLE_GHOST':
      return {
        ...state,
        showGhost: !state.showGhost,
      };

    case 'PLACE_BLOCK':
        if (state.isGameOver || !state.currentBlock) return state;
        return placeBlock({ ...state, isLocking: false });

    case 'MOVE_BLOCK':
      if (state.isGameOver || !state.currentBlock) return state;
      const { dx, dy } = action.payload;
      const newPos = {
        x: state.currentBlock.position.x + dx,
        y: state.currentBlock.position.y + dy,
      };

      if (isValidMove(state.grids[state.activeFace], state.currentBlock, newPos)) {
        const newBlock = new TetrisBlock(state.currentBlock.type);
        newBlock.position = newPos;
        newBlock.shape = state.currentBlock.shape;
        return {
          ...state,
          currentBlock: newBlock,
          isLocking: false,
        };
      } else if (dy === 1) {
        // The block hit something while moving down, start locking
        return { ...state, isLocking: true };
      }
      return state;

    case 'ROTATE_BLOCK':
        if (state.isGameOver || !state.currentBlock) return state;
        const rotatedBlock = new TetrisBlock(state.currentBlock.type);
        rotatedBlock.position = state.currentBlock.position;
        rotatedBlock.shape = [...state.currentBlock.shape];
        rotatedBlock.rotate(); 

        if (isValidMove(state.grids[state.activeFace], rotatedBlock, rotatedBlock.position)) {
            return { ...state, currentBlock: rotatedBlock, isLocking: false };
        }
        return state;

    case 'SET_FACE_ASSIGNMENTS':
      return {
        ...state,
        myFaces: action.payload,
        activeFace: action.payload.includes(state.activeFace) ? state.activeFace : action.payload[0] || 0,
      }

    case 'CHANGE_FACE':
      if (state.isGameOver) return state;
      const { direction } = action.payload;
      let nextFace = state.activeFace;
      let currentIndex = state.myFaces.indexOf(state.activeFace);

      if (direction === 'right') {
        currentIndex = (currentIndex + 1) % state.myFaces.length;
      } else {
        currentIndex = (currentIndex - 1 + state.myFaces.length) % state.myFaces.length;
      }
      nextFace = state.myFaces[currentIndex];
      
      return { ...state, activeFace: nextFace, isLocking: false };

    case 'DROP_BLOCK':
        if (state.isGameOver || !state.currentBlock) return state;

        let newY = state.currentBlock.position.y;
        while(isValidMove(state.grids[state.activeFace], state.currentBlock, {x: state.currentBlock.position.x, y: newY + 1})) {
            newY++;
        }
        
        const newBlock = new TetrisBlock(state.currentBlock.type);
        newBlock.position = {x: state.currentBlock.position.x, y: newY};
        newBlock.shape = state.currentBlock.shape;
        
        const tempState = { ...state, currentBlock: newBlock};

        return placeBlock(tempState);

    default:
      return state;
  }
}
