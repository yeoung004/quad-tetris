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
  score: number;
  isGameOver: boolean;
  myFaces: number[];
  showGhost: boolean;
};

export type GameAction =
  | { type: 'MOVE_BLOCK'; payload: { dx: number; dy: number } }
  | { type: 'ROTATE_BLOCK' }
  | { type: 'CHANGE_FACE'; payload: { direction: 'left' | 'right' } }
  | { type: 'DROP_BLOCK' }
  | { type: 'START_GAME' }
  | { type: 'SET_FACE_ASSIGNMENTS', payload: number[] }
  | { type: 'SET_STATE', payload: GameState }
  | { type: 'TOGGLE_GHOST' };

const initialState: GameState = {
  grids: [createEmptyGrid(), createEmptyGrid(), createEmptyGrid(), createEmptyGrid()],
  activeFace: 0,
  currentBlock: null,
  score: 0,
  isGameOver: false,
  myFaces: [0, 1, 2, 3],
  showGhost: true,
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

  if (blockY < 1) {
    return { ...state, grids: newGrids, isGameOver: true, currentBlock: null };
  }

  const newState: GameState = {
    ...state,
    grids: newGrids,
    currentBlock: spawnNewBlock(),
  };

  return checkMultiFaceLineClear(newState);
}

export function gameReducer(state: GameState = initialState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
        return {
            ...initialState,
            grids: [createEmptyGrid(), createEmptyGrid(), createEmptyGrid(), createEmptyGrid()],
            currentBlock: spawnNewBlock(),
            isGameOver: false,
            score: 0,
        };
    
    case 'SET_STATE':
        return action.payload;

    case 'TOGGLE_GHOST':
      return {
        ...state,
        showGhost: !state.showGhost,
      };

    case 'MOVE_BLOCK':
      if (state.isGameOver || !state.currentBlock) return state;
      const { dx, dy } = action.payload;
      const newPos = {
        x: state.currentBlock.position.x + dx,
        y: state.currentBlock.position.y + dy,
      };

      if (isValidMove(state.grids[state.activeFace], state.currentBlock, newPos)) {
        return {
          ...state,
          currentBlock: { ...state.currentBlock, position: newPos },
        };
      } else if (dy === 1) {
        return placeBlock(state);
      }
      return state;

    case 'ROTATE_BLOCK':
        if (state.isGameOver || !state.currentBlock) return state;
        const rotatedBlock = new TetrisBlock(state.currentBlock.type);
        rotatedBlock.position = state.currentBlock.position;
        rotatedBlock.shape = [...state.currentBlock.shape];
        rotatedBlock.rotate(); 

        if (isValidMove(state.grids[state.activeFace], rotatedBlock, rotatedBlock.position)) {
            return { ...state, currentBlock: rotatedBlock };
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

      if (state.currentBlock && !isValidMove(state.grids[nextFace], state.currentBlock, state.currentBlock.position)) {
        return state; 
      }
      
      return { ...state, activeFace: nextFace };

    case 'DROP_BLOCK':
        if (state.isGameOver || !state.currentBlock) return state;

        let newY = state.currentBlock.position.y;
        while(isValidMove(state.grids[state.activeFace], state.currentBlock, {x: state.currentBlock.position.x, y: newY + 1})) {
            newY++;
        }
        
        const tempState = { ...state, currentBlock: {...state.currentBlock, position: {x: state.currentBlock.position.x, y: newY}}};

        return placeBlock(tempState);

    default:
      return state;
  }
}
