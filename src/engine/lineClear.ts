import { GameState, GRID_WIDTH } from './gameReducer';

const POINTS_PER_LINE = 100;
const LINES_PER_LEVEL = 10;

export function checkMultiFaceLineClear(gameState: GameState): GameState {
  const { grids, score, linesCleared: totalLinesCleared, level } = gameState;
  let newGrids = grids.map(grid => grid.map(row => [...row]));
  let numLinesCleared = 0;
  
  for (let y = 0; y < newGrids[0].length; y++) {
    const isLineFull = newGrids.every(grid => grid[y].every(cell => cell !== 0));

    if (isLineFull) {
      numLinesCleared++;
      // Remove the line from all grids
      for (let i = 0; i < newGrids.length; i++) {
        newGrids[i].splice(y, 1);
        newGrids[i].unshift(Array(GRID_WIDTH).fill(0));
      }
    }
  }

  if (numLinesCleared > 0) {
    const newTotalLinesCleared = totalLinesCleared + numLinesCleared;
    const newLevel = Math.floor(newTotalLinesCleared / LINES_PER_LEVEL) + 1;

    return {
      ...gameState,
      grids: newGrids,
      score: score + numLinesCleared * POINTS_PER_LINE * numLinesCleared, // Bonus for multiple lines
      linesCleared: newTotalLinesCleared,
      level: newLevel,
    };
  }

  return gameState;
}