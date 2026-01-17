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
  console.log(result);
  return result;
}

