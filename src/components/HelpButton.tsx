import React from 'react';
import './HelpButton.css';

interface HelpButtonProps {
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
}

const HelpButton: React.FC<HelpButtonProps> = ({ onClick }) => {
  return (
    <div
      className="help-button"
      onClick={onClick}
      onTouchStart={onClick}
    >
      ?
    </div>
  );
};

export default HelpButton;
