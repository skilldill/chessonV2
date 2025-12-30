type PieceLetter = "P" | "N" | "B" | "R" | "Q" | "K";

type PieceValues = Partial<Record<PieceLetter, number>>;

interface MaterialResult {
  white: {
    pawns: number;          // суммарный материал в пешках
    percentOfStart: number; // % от стартового материала (35 по дефолту)
    shareOfRemaining: number; // % от общего оставшегося материала на доске
  };
  black: {
    pawns: number;
    percentOfStart: number;
    shareOfRemaining: number;
  };
}

/**
 * Считает материал (в пешечных экв.) и проценты для обеих сторон.
 * @param fen FEN-строка (используется первая часть: расположение)
 * @param color "white" | "black" — на логику не влияет, но можно использовать для UI-приоритетов
 * @param values Кастомные стоимости фигур (по умолчанию: P=1, N=2, B=2, R=5, Q=9, K=0)
 */
export function getMaterialPercents(
  fen: string,
  values: PieceValues = {}
): MaterialResult {
  // Значения по умолчанию (пешечный эквивалент)
  const VALS: Record<PieceLetter, number> = {
    P: values.P ?? 1,
    N: values.N ?? 2,
    B: values.B ?? 2,
    R: values.R ?? 5,
    Q: values.Q ?? 9,
    K: values.K ?? 0, // короля в материал обычно не включают
  };

  // Стартовый материал без короля:
  // 8P + 2N + 2B + 2R + 1Q = 8*1 + 2*2 + 2*2 + 2*5 + 1*9 = 35 (по дефолтным VALS)
  const START_MATERIAL =
    8 * VALS.P + 2 * VALS.N + 2 * VALS.B + 2 * VALS.R + 1 * VALS.Q;

  const board = fen.trim().split(" ")[0] ?? "";
  const counts = {
    white: { P: 0, N: 0, B: 0, R: 0, Q: 0, K: 0 } as Record<PieceLetter, number>,
    black: { P: 0, N: 0, B: 0, R: 0, Q: 0, K: 0 } as Record<PieceLetter, number>,
  };

  // Парсим первую часть FEN
  for (const ch of board) {
    if (/[1-8]/.test(ch)) continue;
    if (/[prnbqk]/.test(ch)) counts.black[ch.toUpperCase() as PieceLetter] += 1;
    else if (/[PRNBQK]/.test(ch)) counts.white[ch as PieceLetter] += 1;
  }

  // Подсчёт материала в пешках
  const materialWhite =
    counts.white.P * VALS.P +
    counts.white.N * VALS.N +
    counts.white.B * VALS.B +
    counts.white.R * VALS.R +
    counts.white.Q * VALS.Q;
  const materialBlack =
    counts.black.P * VALS.P +
    counts.black.N * VALS.N +
    counts.black.B * VALS.B +
    counts.black.R * VALS.R +
    counts.black.Q * VALS.Q;

  const totalRemaining = materialWhite + materialBlack;

  const percentOfStartWhite =
    START_MATERIAL === 0 ? 0 : (materialWhite / START_MATERIAL) * 100;
  const percentOfStartBlack =
    START_MATERIAL === 0 ? 0 : (materialBlack / START_MATERIAL) * 100;

  const shareWhite =
    totalRemaining === 0 ? 50 : (materialWhite / totalRemaining) * 100;
  const shareBlack =
    totalRemaining === 0 ? 50 : (materialBlack / totalRemaining) * 100;

  // Округлим до десятых (можешь убрать округление, если нужно «сырое» значение)
  const round1 = (x: number) => Math.round(x * 10) / 10;

  return {
    white: {
      pawns: materialWhite,
      percentOfStart: round1(percentOfStartWhite),
      shareOfRemaining: round1(shareWhite),
    },
    black: {
      pawns: materialBlack,
      percentOfStart: round1(percentOfStartBlack),
      shareOfRemaining: round1(shareBlack),
    },
  };
}
