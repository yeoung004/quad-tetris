import React, { useReducer, useEffect, useState } from 'react';
import io from 'socket.io-client';
import GameBoard3D from './components/GameBoard3D';
import { gameReducer, GameState } from './engine/gameReducer';
import { createEmptyGrid } from './engine/gameReducer';
import { TetrisBlock } from './engine/TetrisBlock';

const socket = io('http://localhost:3001');

const App: React.FC = () => {
    const [gameState, dispatch] = useReducer(gameReducer, {
        grids: [createEmptyGrid(), createEmptyGrid(), createEmptyGrid(), createEmptyGrid()],
        activeFace: 0,
        currentBlock: new TetrisBlock('I'),
        score: 0,
        isGameOver: false,
        myFaces: [0,1,2,3],
    });
    const [room, setRoom] = useState('tetris_room');

    useEffect(() => {
        socket.emit('join_room', room);

        socket.on('face_assignments', (assignments) => {
            const myFaces = assignments[socket.id];
            if (myFaces) {
                dispatch({ type: 'SET_FACE_ASSIGNMENTS', payload: myFaces });
            }
        });
        
        socket.on('game_state_update', (newGameState: GameState) => {
            // Here you might want to merge states carefully
            // For now, we just accept the grids, score and isGameOver status
            dispatch({type: 'START_GAME' })// a hack to get a new block
            // dispatch({ type: 'SET_STATE', payload: newGameState });
        });


        dispatch({ type: 'START_GAME' });

        return () => {
            socket.off('face_assignments');
            socket.off('game_state_update');
        }
    }, [room]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState.isGameOver || !gameState.myFaces.includes(gameState.activeFace)) return;

            switch (e.key) {
                case 'ArrowLeft':
                    dispatch({ type: 'MOVE_BLOCK', payload: { dx: -1, dy: 0 } });
                    break;
                case 'ArrowRight':
                    dispatch({ type: 'MOVE_BLOCK', payload: { dx: 1, dy: 0 } });
                    break;
                case 'ArrowDown':
                    dispatch({ type: 'MOVE_BLOCK', payload: { dx: 0, dy: 1 } });
                    break;
                case 'ArrowUp':
                    dispatch({ type: 'ROTATE_BLOCK' });
                    break;
                case ' ': // Space bar
                    dispatch({ type: 'DROP_BLOCK' });
                    break;
                case 'q':
                    dispatch({ type: 'CHANGE_FACE', payload: { direction: 'left' } });
                    break;
                case 'e':
                    dispatch({ type: 'CHANGE_FACE', payload: { direction: 'right' } });
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameState.isGameOver, gameState.myFaces, gameState.activeFace]);

    useEffect(() => {
        if (gameState.isGameOver || !gameState.myFaces.includes(gameState.activeFace)) return;

        const gameInterval = setInterval(() => {
            dispatch({ type: 'MOVE_BLOCK', payload: { dx: 0, dy: 1 } });
        }, 1000);

        return () => clearInterval(gameInterval);
    }, [gameState.isGameOver, gameState.myFaces, gameState.activeFace]);

    useEffect(() => {
        if(socket && gameState.currentBlock) { // only send updates if there is a current block
            socket.emit('game_state_update', room, gameState);
        }
    }, [gameState, room]);


    const infoStyles: React.CSSProperties = {
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        fontFamily: 'monospace',
        fontSize: '18px'
    };

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#222' }}>
            <div style={infoStyles}>
                <p>Score: {gameState.score}</p>
                <p>Face: {gameState.activeFace}</p>
                <p>My Faces: {gameState.myFaces.join(', ')}</p>
                {gameState.isGameOver && <p style={{color: 'red'}}>GAME OVER</p>}
                <div>
                    Controls:<br/>
                    Arrows: Move & Rotate<br/>
                    Space: Drop<br/>
                    Q/E: Change Face
                </div>
            </div>
            <GameBoard3D gameState={gameState} dispatch={dispatch} />
        </div>
    );
}

export default App;
