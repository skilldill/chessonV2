import type { AnalysisMoveData, FigureType } from './types';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const PIECE_LETTERS: Record<FigureType, string> = {
  pawn: '',
  knight: 'N',
  bishop: 'B',
  rook: 'R',
  queen: 'Q',
  king: 'K',
};

type FenPiece = {
  color: 'white' | 'black';
  type: FigureType;
};

export function getReadableAnalysisNotation(move: AnalysisMoveData, previousFen: string): string {
  const castling = getCastlingNotation(move);
  if (castling) {
    return castling;
  }

  const destination = coordsToSquare(move.to);
  const capturedPiece = getPieceAt(previousFen, move.to);
  const isCapture = Boolean(capturedPiece) || isLikelyEnPassant(move, previousFen);
  const pieceLetter = PIECE_LETTERS[move.figure.type];
  const promotion = getPromotionSuffix(move, previousFen);

  if (move.figure.type === 'pawn') {
    const originFile = FILES[move.from[0]] ?? '';
    return `${isCapture ? `${originFile}x` : ''}${destination}${promotion}`;
  }

  return `${pieceLetter}${isCapture ? 'x' : ''}${destination}`;
}

function getCastlingNotation(move: AnalysisMoveData): string | null {
  if (move.figure.type !== 'king') {
    return null;
  }

  const [fromX] = move.from;
  const [toX] = move.to;
  const distance = Math.abs(toX - fromX);

  if (distance < 2 && toX !== 1 && toX !== 6) {
    return null;
  }

  return toX > fromX || toX === 6 ? '0-0' : '0-0-0';
}

function getPromotionSuffix(move: AnalysisMoveData, previousFen: string): string {
  const movedPieceBefore = getPieceAt(previousFen, move.from);
  const wasPawn = movedPieceBefore?.type === 'pawn' || move.figure.type === 'pawn';
  const reachesLastRank = move.to[1] === 0 || move.to[1] === 7;

  if (!wasPawn || !reachesLastRank || move.figure.type === 'pawn') {
    return '';
  }

  return `=${PIECE_LETTERS[move.figure.type]}`;
}

function isLikelyEnPassant(move: AnalysisMoveData, previousFen: string): boolean {
  if (move.figure.type !== 'pawn') {
    return false;
  }

  if (move.from[0] === move.to[0]) {
    return false;
  }

  return !getPieceAt(previousFen, move.to);
}

function coordsToSquare(coords: [number, number]): string {
  const [x, y] = coords;
  const file = FILES[x] ?? 'a';
  return `${file}${8 - y}`;
}

function getPieceAt(fen: string, coords: [number, number]): FenPiece | null {
  const boardPart = fen.split(' ')[0];
  const rows = boardPart.split('/');
  const [targetX, targetY] = coords;
  const row = rows[targetY];

  if (!row) {
    return null;
  }

  let x = 0;
  for (const char of row) {
    const digit = Number.parseInt(char, 10);
    if (!Number.isNaN(digit)) {
      x += digit;
      continue;
    }

    if (x === targetX) {
      const typeMap: Record<string, FigureType> = {
        p: 'pawn',
        n: 'knight',
        b: 'bishop',
        r: 'rook',
        q: 'queen',
        k: 'king',
      };

      const type = typeMap[char.toLowerCase()];
      if (!type) {
        return null;
      }

      return {
        color: char === char.toUpperCase() ? 'white' : 'black',
        type,
      };
    }

    x += 1;
  }

  return null;
}
