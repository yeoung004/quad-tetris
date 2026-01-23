import { TetrisBlock } from "./TetrisBlock";

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;
export const NUM_FACES = 4;

export const createEmptyGrid = (): (string | number)[][] =>
  Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(0));

export function isValidMove(
  grids: (string | number)[][][],
  activeFace: number,
  block: TetrisBlock,
  newPosition: { x: number; y: number }
): boolean {
  for (let y = 0; y < block.shape.length; y++) {
    for (let x = 0; x < block.shape[y].length; x++) {
      if (block.shape[y][x] !== 0) {
        const newX = newPosition.x + x;
        const newY = newPosition.y + y;

        // Y bounds check (vertical)
        if (newY >= GRID_HEIGHT) {
          return false; // Hit the floor
        }

        // X bounds check (horizontal) and cross-face logic
        let face = activeFace;
        let checkX = newX;

        if (newX < 0) {
          // Moved past the left edge
          face = (activeFace - 1 + NUM_FACES) % NUM_FACES;
          checkX = newX + GRID_WIDTH;
        } else if (newX >= GRID_WIDTH) {
          // Moved past the right edge
          face = (activeFace + 1) % NUM_FACES;
          checkX = newX - GRID_WIDTH;
        }

        // Collision check on the potentially new face
        if (newY >= 0) {
          const gridToCheck = grids[face];
          if (
            gridToCheck && // Ensure grid exists
            gridToCheck[newY] && // Ensure row exists
            gridToCheck[newY][checkX] !== 0
          ) {
            return false; // Collision with an existing block
          }
          
          // Shared edge collision check
          if (checkX === 0) {
            const prevFaceIndex = (face - 1 + NUM_FACES) % NUM_FACES;
            const prevGrid = grids[prevFaceIndex];
            if (prevGrid && prevGrid[newY] && prevGrid[newY][GRID_WIDTH - 1] !== 0) {
              return false;
            }
          } else if (checkX === GRID_WIDTH - 1) {
            const nextFaceIndex = (face + 1) % NUM_FACES;
            const nextGrid = grids[nextFaceIndex];
            if (nextGrid && nextGrid[newY] && nextGrid[newY][0] !== 0) {
              return false;
            }
          }
        }
      }
    }
  }
  return true;
}
