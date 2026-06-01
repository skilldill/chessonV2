import { FENtoGameState, JSChessEngine, stateToFEN, type Cell, type FigureColor } from "react-chessboard-ui";
import type { MoveData } from "../types";
import type { Puzzle } from "../types/puzzle";

type BoardPiece = {
  color: "white" | "black";
  type: MoveData["figure"]["type"];
};

type Board = Array<Array<BoardPiece | null>>;

const pieceToFen: Record<BoardPiece["type"], string> = {
  pawn: "p",
  knight: "n",
  bishop: "b",
  rook: "r",
  queen: "q",
  king: "k",
};

const fenToPiece: Record<string, BoardPiece["type"]> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

export function isPuzzlePlayable(puzzle: Puzzle): boolean {
  if (!puzzle.initialFEN || !Array.isArray(puzzle.solution) || puzzle.solution.length === 0) {
    return false;
  }

  if (!isPuzzlePlayableByChessboardEngine(puzzle)) {
    return false;
  }

  const initialBoard = parseFenBoard(puzzle.initialFEN);
  if (!initialBoard) {
    return false;
  }

  let board = initialBoard;
  for (const move of puzzle.solution) {
    const nextBoard = applyMove(board, move);
    if (!nextBoard) {
      return false;
    }

    if (boardToFenPart(nextBoard) !== getFenBoardPart(move.FEN)) {
      return false;
    }

    board = nextBoard;
  }

  return true;
}

function isPuzzlePlayableByChessboardEngine(puzzle: Puzzle): boolean {
  let currentFen = puzzle.initialFEN;

  try {
    for (const move of puzzle.solution) {
      const { boardState, currentColor } = FENtoGameState(currentFen, false);
      const [fromX, fromY] = move.from;
      const movingFigure = boardState[fromY]?.[fromX]?.figure;

      if (
        !movingFigure
        || movingFigure.color !== move.figure.color
        || movingFigure.color !== currentColor
        || (move.type !== "transform" && movingFigure.type !== move.figure.type)
      ) {
        return false;
      }

      const linesWithCheck = JSChessEngine.getLinesWithCheck(boardState, getOppositeColor(currentColor), false);
      const nextMoves = JSChessEngine.getNextMoves(boardState, move.from, linesWithCheck, false);
      const isLegalMove = nextMoves.some(([x, y]) => x === move.to[0] && y === move.to[1]);
      const isCastlingMove = movingFigure.type === "king" && move.from[1] === move.to[1] && Math.abs(move.to[0] - move.from[0]) > 1;

      if (!isLegalMove && !isCastlingMove) {
        return false;
      }

      const nextState = applyMoveByChessboardEngine(boardState, move, movingFigure);
      const nextFen = stateToFEN(nextState, getOppositeColor(currentColor));
      if (getFenBoardPart(nextFen) !== getFenBoardPart(move.FEN)) {
        return false;
      }

      currentFen = move.FEN;
    }
  } catch {
    return false;
  }

  return true;
}

function applyMoveByChessboardEngine(
  boardState: Cell[][],
  move: MoveData,
  movingFigure: NonNullable<Cell["figure"]>,
): Cell[][] {
  if (move.type === "transform") {
    return JSChessEngine.transformPawnToFigure(boardState, move.from, move.to, {
      color: movingFigure.color,
      type: move.figure.type,
    });
  }

  return JSChessEngine.changeState(boardState, movingFigure, move.to, move.from, false).updatedCells;
}

function getOppositeColor(color: FigureColor): FigureColor {
  return color === "white" ? "black" : "white";
}

function applyMove(board: Board, move: MoveData): Board | null {
  const [fromX, fromY] = move.from;
  const [toX, toY] = move.to;

  if (!isInBoard(fromX, fromY) || !isInBoard(toX, toY)) {
    return null;
  }

  const movingPiece = board[fromY]?.[fromX];
  if (!movingPiece || movingPiece.color !== move.figure.color) {
    return null;
  }

  const isPromotion = move.type === "transform";
  if (!isPromotion && movingPiece.type !== move.figure.type) {
    return null;
  }

  const nextBoard = board.map((row) => row.map((piece) => piece ? { ...piece } : null));
  const targetPiece = nextBoard[toY][toX];
  if (targetPiece?.color === movingPiece.color) {
    return null;
  }

  nextBoard[fromY][fromX] = null;

  if (movingPiece.type === "king" && fromY === toY && Math.abs(toX - fromX) > 1) {
    const isShortCastle = toX > fromX;
    const rookFromX = isShortCastle ? 7 : 0;
    const rookToX = isShortCastle ? 5 : 3;
    const kingToX = isShortCastle ? 6 : 2;
    const rook = nextBoard[fromY][rookFromX];

    if (!rook || rook.color !== movingPiece.color || rook.type !== "rook") {
      return null;
    }

    nextBoard[fromY][rookFromX] = null;
    nextBoard[fromY][rookToX] = rook;
    nextBoard[fromY][kingToX] = movingPiece;
    return nextBoard;
  }

  if (movingPiece.type === "pawn" && fromX !== toX && !targetPiece) {
    const capturedPawn = nextBoard[fromY][toX];
    if (!capturedPawn || capturedPawn.color === movingPiece.color || capturedPawn.type !== "pawn") {
      return null;
    }
    nextBoard[fromY][toX] = null;
  }

  nextBoard[toY][toX] = isPromotion
    ? { color: movingPiece.color, type: move.figure.type }
    : movingPiece;

  return nextBoard;
}

function parseFenBoard(fen: string): Board | null {
  const rows = getFenBoardPart(fen).split("/");
  if (rows.length !== 8) {
    return null;
  }

  const board: Board = [];
  for (const row of rows) {
    const cells: Array<BoardPiece | null> = [];
    for (const char of row) {
      const emptyCount = Number.parseInt(char, 10);
      if (Number.isFinite(emptyCount)) {
        cells.push(...Array<null>(emptyCount).fill(null));
        continue;
      }

      const type = fenToPiece[char.toLowerCase()];
      if (!type) {
        return null;
      }

      cells.push({
        color: char === char.toUpperCase() ? "white" : "black",
        type,
      });
    }

    if (cells.length !== 8) {
      return null;
    }

    board.push(cells);
  }

  return board;
}

function boardToFenPart(board: Board): string {
  return board.map((row) => {
    let emptyCount = 0;
    let result = "";

    for (const piece of row) {
      if (!piece) {
        emptyCount += 1;
        continue;
      }

      if (emptyCount > 0) {
        result += String(emptyCount);
        emptyCount = 0;
      }

      const fenPiece = pieceToFen[piece.type];
      result += piece.color === "white" ? fenPiece.toUpperCase() : fenPiece;
    }

    return emptyCount > 0 ? `${result}${emptyCount}` : result;
  }).join("/");
}

function getFenBoardPart(fen: string): string {
  return fen.trim().split(/\s+/)[0] ?? "";
}

function isInBoard(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < 8 && y >= 0 && y < 8;
}
