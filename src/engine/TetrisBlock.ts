export const TETROMINOS = {
  0: { shape: [[0]], color: "rgba(0,0,0,0)" }, // Empty cell
  I: {
    shape: [
      [0, "I", 0, 0],
      [0, "I", 0, 0],
      [0, "I", 0, 0],
      [0, "I", 0, 0],
    ],
    color: "#00f0f0", // Cyan
  },
  J: {
    shape: [
      [0, "J", 0],
      [0, "J", 0],
      ["J", "J", 0],
    ],
    color: "#0000f0", // Blue
  },
  L: {
    shape: [
      [0, "L", 0],
      [0, "L", 0],
      [0, "L", "L"],
    ],
    color: "#f0a000", // Orange
  },
  O: {
    shape: [
      ["O", "O"],
      ["O", "O"],
    ],
    color: "#f0f000", // Yellow
  },
  S: {
    shape: [
      [0, "S", "S"],
      ["S", "S", 0],
      [0, 0, 0],
    ],
    color: "#00f000", // Green
  },
  T: {
    shape: [
      ["T", "T", "T"],
      [0, "T", 0],
      [0, 0, 0],
    ],
    color: "#a000f0", // Purple
  },
  Z: {
    shape: [
      ["Z", "Z", 0],
      [0, "Z", "Z"],
      [0, 0, 0],
    ],
    color: "#f00000", // Red
  },
};

export type TetrominoKey = keyof typeof TETROMINOS;

export class TetrisBlock {
  shape: (string | number)[][];
  color: string;
  position: { x: number; y: number };
  type: TetrominoKey;

  constructor(type: TetrominoKey) {
    this.type = type;
    this.shape = TETROMINOS[type].shape;
    this.color = TETROMINOS[type].color;
    this.position = { x: 3, y: 0 }; // Initial position
  }

  rotate() {
    // Transpose and reverse rows to rotate
    const newShape = this.shape[0].map((_, colIndex) =>
      this.shape.map((row) => row[colIndex])
    );
    this.shape = newShape.map((row) => row.reverse());
  }
}
