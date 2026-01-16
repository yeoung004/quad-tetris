
import React, { useState, useEffect } from 'react';

const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};

const KeyHints: React.FC = () => {
  const [width] = useWindowSize();
  const isMobile = width < 768;

  const desktopHints = (
    <ul>
      <li><span>Q/E</span> : Rotate Face</li>
      <li><span>&larr;&uarr;&rarr;&darr;</span> : Move/Rotate</li>
      <li><span>Space</span> : Drop</li>
      <li><span>G</span> : Ghost Toggle</li>
      <li><span>F</span> : Focus Mode</li>
    </ul>
  );

  const mobileHints = (
    <ul>
        <li><span>🔄</span> : Rotate Face</li>
        <li><span>👻</span> : Ghost Toggle</li>
        <li><span>Tap</span> : Rotate</li>
        <li><span>Swipe</span> : Move</li>
        <li><span>Swipe Down</span> : Drop</li>
    </ul>
  );

  return (
    <div className="key-hints">
      <h3>{isMobile ? 'Controls' : 'Key Hints'}</h3>
      {isMobile ? mobileHints : desktopHints}
      <style>{`
        .key-hints {
          position: absolute;
          bottom: 20px;
          left: 20px;
          z-index: 100;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 15px;
          border-radius: 10px;
          font-family: 'Cutive Mono', 'Courier New', monospace;
          font-size: 16px;
          border: 1px solid #00ffff;
          text-shadow: 0 0 5px #00ffff;
        }
        .key-hints h3 {
          margin-top: 0;
          color: #00ffff;
          text-align: center;
          margin-bottom: 10px;
        }
        .key-hints ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .key-hints li {
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }
        .key-hints span {
          display: inline-block;
          width: 85px;
          font-weight: bold;
          color: #00ffff;
          text-align: center;
        }

        @media (max-width: 768px) {
          .key-hints {
            font-size: 14px;
            padding: 10px;
          }
          .key-hints span {
            width: 40px;
          }
        }
      `}</style>
    </div>
  );
};

export default KeyHints;
