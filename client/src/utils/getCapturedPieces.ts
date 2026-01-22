import type { FigureColor } from "react-chessboard-ui";

type PieceLetter = "P" | "N" | "B" | "R" | "Q" | "K";
type PieceName = "pawn" | "knight" | "bishop" | "rook" | "queen";
type CapturedPieceName =
  | "pawn-white"
  | "knight-white"
  | "bishop-white"
  | "rook-white"
  | "queen-white"
  | "pawn-black"
  | "knight-black"
  | "bishop-black"
  | "rook-black"
  | "queen-black";

/**
 * Возвращает список съеденных фигур для указанного цвета по FEN.
 * Формат результата: ["pawn-white", "bishop-white", ...]
 */
export function getCapturedPieces(
  fen: string,
  color: FigureColor
): CapturedPieceName[] {
  const START_COUNTS: Record<PieceLetter, number> = {
    P: 8,
    N: 2,
    B: 2,
    R: 2,
    Q: 1,
    K: 1,
  };

  // Разбираем доску из FEN
  const board = fen.split(" ")[0];
  const cells: string[] = [];
  for (const ch of board) {
    if (/[1-8]/.test(ch)) {
      cells.push(...Array(Number(ch)).fill(""));
    } else if (/[prnbqkPRNBQK]/.test(ch)) {
      cells.push(ch);
    }
  }

  // Подсчитываем оставшиеся фигуры указанного цвета
  const isWhite = color === "white";
  const remaining: Record<PieceLetter, number> = {
    P: 0,
    N: 0,
    B: 0,
    R: 0,
    Q: 0,
    K: 0,
  };

  for (const c of cells) {
    if (!c) continue;
    const isUpper = c === c.toUpperCase();
    if ((isWhite && isUpper) || (!isWhite && !isUpper)) {
      const piece = c.toUpperCase() as PieceLetter;
      remaining[piece]++;
    }
  }

  // Определяем промоции (избыток фигур над стартовым числом)
  const promoSurplus = (["N", "B", "R", "Q"] as PieceLetter[]).reduce(
    (sum, t) => sum + Math.max(0, remaining[t] - START_COUNTS[t]),
    0
  );

  // Считаем количество съеденных фигур
  const capturedCounts: Record<Exclude<PieceLetter, "K">, number> = {
    P: Math.max(0, START_COUNTS.P - remaining.P - promoSurplus),
    N: Math.max(0, START_COUNTS.N - Math.min(remaining.N, START_COUNTS.N)),
    B: Math.max(0, START_COUNTS.B - Math.min(remaining.B, START_COUNTS.B)),
    R: Math.max(0, START_COUNTS.R - Math.min(remaining.R, START_COUNTS.R)),
    Q: Math.max(0, START_COUNTS.Q - Math.min(remaining.Q, START_COUNTS.Q)),
  };

  const names: Record<Exclude<PieceLetter, "K">, PieceName> = {
    P: "pawn",
    N: "knight",
    B: "bishop",
    R: "rook",
    Q: "queen",
  };

  const result: CapturedPieceName[] = [];
  for (const key of Object.keys(capturedCounts) as Array<
    Exclude<PieceLetter, "K">
  >) {
    for (let i = 0; i < capturedCounts[key]; i++) {
      result.push(`${names[key]}-${color}` as CapturedPieceName);
    }
  }

  return result;
}

/**
 * Сравнивает две FEN нотации и возвращает фигуру, которая исчезла (была захвачена).
 * Возвращает null, если фигура не была захвачена или если произошла промоция.
 */
export function getLastCapturedPieces(
  initialFEN: string,
  actualFEN: string
): CapturedPieceName | null {
  // Разбираем доски из FEN (берем первую часть до пробела)
  const parseBoard = (fen: string): string[] => {
    const board = fen.split(" ")[0];
    const cells: string[] = [];
    for (const ch of board) {
      if (/[1-8]/.test(ch)) {
        cells.push(...Array(Number(ch)).fill(""));
      } else if (/[prnbqkPRNBQK]/.test(ch)) {
        cells.push(ch);
      }
    }
    return cells;
  };

  const initialCells = parseBoard(initialFEN);
  const actualCells = parseBoard(actualFEN);

  // Подсчитываем количество каждой фигуры в обеих досках
  const countPieces = (cells: string[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const cell of cells) {
      if (cell && /[prnbqkPRNBQK]/.test(cell)) {
        counts[cell] = (counts[cell] || 0) + 1;
      }
    }
    return counts;
  };

  const initialCounts = countPieces(initialCells);
  const actualCounts = countPieces(actualCells);

  // Подсчитываем общее количество фигур каждого цвета
  const countByColor = (counts: Record<string, number>, isWhite: boolean): number => {
    let total = 0;
    for (const piece of Object.keys(counts)) {
      const isUpper = piece === piece.toUpperCase();
      if ((isWhite && isUpper) || (!isWhite && !isUpper)) {
        total += counts[piece] || 0;
      }
    }
    return total;
  };

  const initialWhiteCount = countByColor(initialCounts, true);
  const actualWhiteCount = countByColor(actualCounts, true);
  const initialBlackCount = countByColor(initialCounts, false);
  const actualBlackCount = countByColor(actualCounts, false);

  // Находим фигуру, которая исчезла
  const pieceMap: Record<string, CapturedPieceName> = {
    P: "pawn-white",
    N: "knight-white",
    B: "bishop-white",
    R: "rook-white",
    Q: "queen-white",
    p: "pawn-black",
    n: "knight-black",
    b: "bishop-black",
    r: "rook-black",
    q: "queen-black",
  };

  // Сначала проверяем, есть ли изменения в количестве фигур
  let disappearedPiece: string | null = null;
  let disappearedColor: boolean | null = null;

  // Находим все фигуры, количество которых уменьшилось
  for (const piece of Object.keys(pieceMap)) {
    const initialCount = initialCounts[piece] || 0;
    const actualCount = actualCounts[piece] || 0;

    if (initialCount > actualCount) {
      disappearedPiece = piece;
      disappearedColor = piece === piece.toUpperCase();
      break; // Находим первую исчезнувшую фигуру
    }
  }

  // Если фигура исчезла, проверяем, не произошла ли промоция
  if (disappearedPiece !== null && disappearedColor !== null) {
    const initialColorCount = disappearedColor ? initialWhiteCount : initialBlackCount;
    const actualColorCount = disappearedColor ? actualWhiteCount : actualBlackCount;

    // Если общее количество фигур этого цвета не изменилось, значит это промоция
    if (initialColorCount === actualColorCount) {
      return null;
    }

    // Иначе это захват
    return pieceMap[disappearedPiece];
  }

  // Если ничего не найдено, возвращаем null
  return null;
}
