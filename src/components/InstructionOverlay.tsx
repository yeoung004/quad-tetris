import React from 'react';
import './InstructionOverlay.css';
import useWindowSize from '../hooks/useWindowSize';

interface InstructionOverlayProps {
  onClose: () => void;
}

const InstructionOverlay: React.FC<InstructionOverlayProps> = ({ onClose }) => {
  const { width } = useWindowSize();
  const isMobileLayout = width < 1024; // Define what constitutes a mobile layout

  return (
    <div className="instruction-overlay" onClick={onClose}>
      <div className="instruction-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>X</button>
        <h1>How to Play</h1>
        <div className="instructions">
          <p>Clear lines across all 4 faces of the cube to get the highest score. The game gets faster over time. Survive as long as you can!</p>
          
          {isMobileLayout ? (
            <>
              <h2>Controls</h2>
              <div className="control-group">
                <p><strong>Swipe Left/Right:</strong> Move the block.</p>
                <p><strong>Swipe Down:</strong> Drop the block.</p>
                <p><strong>Tap:</strong> Rotate the block.</p>
                <p><strong>Long Press:</strong> Fast drop.</p>
                <p><strong>Tap Edges:</strong> Rotate the entire cube face.</p>
              </div>
            </>
          ) : (
            <>
              <h2>Controls</h2>
              <div className="control-group">
                <p><strong>Arrow Keys (← → ↓):</strong> Move the block.</p>
                <p><strong>Arrow Key (↑):</strong> Rotate the block.</p>
                <p><strong>Space Bar:</strong> Hard drop the block.</p>
                <p><strong>Q / E:</strong> Rotate the entire cube face.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructionOverlay;
