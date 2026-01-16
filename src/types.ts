import { TetrisBlock } from './engine/TetrisBlock';

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
  isFocusMode: boolean;
};
