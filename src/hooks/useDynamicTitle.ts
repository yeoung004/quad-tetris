import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { scoreAtom, isGameOverAtom } from '../atoms/gameAtoms';

const useDynamicTitle = () => {
  const score = useAtomValue(scoreAtom);
  const isGameOver = useAtomValue(isGameOverAtom);

  useEffect(() => {
    if (isGameOver) {
      document.title = `Game Over - Score: ${score} | Quad-Tetris`;
    } else {
      document.title = 'Quad-Tetris: A 3D Cyberpunk Browser Game';
    }
  }, [score, isGameOver]);
};

export default useDynamicTitle;
