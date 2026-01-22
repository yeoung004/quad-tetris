import { useAtom } from "jotai";
import { isInfoOpenAtom } from "../atoms/gameAtoms";

const InfoToggle = () => {
  const [isInfoOpen, setIsInfoOpen] = useAtom(isInfoOpenAtom);

  const toggleStyle: React.CSSProperties = {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 200, // Make sure it's on top
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <button style={toggleStyle} onClick={() => setIsInfoOpen(!isInfoOpen)}>
      ℹ️
    </button>
  );
};

export default InfoToggle;
