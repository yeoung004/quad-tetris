import { useIsMobile } from "../hooks/useIsMobile";

interface GameOverUIProps {
  onRestart: () => void;
}

const GameOverUI = ({ onRestart }: GameOverUIProps) => {
  const isMobile = useIsMobile();

  const handleRestart = () => {
    onRestart();
  };

  return (
    <div
      role="button"
      aria-label="Restart Game"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        color: "white",
        zIndex: 99,
        cursor: "pointer",
        fontFamily: "'Orbitron', sans-serif",
      }}
      onClick={handleRestart}
    >
      <h1 style={{ fontSize: "3rem", textShadow: "0 0 10px #f00" }}>
        GAME OVER
      </h1>
      <p style={{ fontSize: "1.5rem", marginTop: "1rem" }}>
        {isMobile ? "TOUCH SCREEN TO RESTART" : "PRESS SPACE TO RESTART"}
      </p>
    </div>
  );
};

export default GameOverUI;
