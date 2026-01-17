import { TetrisBlock } from "./TetrisBlock";

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;

export const createEmptyGrid = (): (string | number)[][] =>
  Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(0));

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

        if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
          return false;
        }

        if (newY >= 0) {
          if (grid[newY][newX] !== 0) {
            return false;
          }
        }
      }
    }
  }
  return true;
}
