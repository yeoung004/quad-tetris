import { GameState, GRID_WIDTH } from './gameReducer';

const POINTS_PER_LINE = 100;

export function checkMultiFaceLineClear(gameState: GameState): GameState {
  const { grids, score } = gameState;
  let newGrids = grids.map(grid => grid.map(row => [...row]));
  let linesCleared = 0;
  
  for (let y = 0; y < newGrids[0].length; y++) {
    const isLineFull = newGrids.every(grid => grid[y].every(cell => cell !== 0));

    if (isLineFull) {
      linesCleared++;
      // Remove the line from all grids
      for (let i = 0; i < newGrids.length; i++) {
        newGrids[i].splice(y, 1);
        newGrids[i].unshift(Array(GRID_WIDTH).fill(0));
      }
    }
  }

  if (linesCleared > 0) {
    return {
      ...gameState,
      grids: newGrids,
      score: score + linesCleared * POINTS_PER_LINE * linesCleared, // Bonus for multiple lines
    };
  }

  return gameState;
}