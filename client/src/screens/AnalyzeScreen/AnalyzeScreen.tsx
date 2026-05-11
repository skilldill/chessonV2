import { useEffect, useMemo, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { ChessBoard } from "react-chessboard-ui";
import { API_PREFIX } from "../../constants/api";
import type { MoveData } from "../../types";
import { ChessboardWrap } from "../../components/ChessboardWrap/ChessboardWrap";
import { getReadableMoveNotation } from "../../utils/getReadableMoveNotation";

type AnalysisEntry = {
  ply: number;
  fenBefore: string;
  fenAfter: string;
  playedMoveUci: string;
  bestMoveUci: string;
  scoreCp?: number;
  depth?: number;
};

type AnalyzeResponse = {
  success: boolean;
  roomId: string;
  status: "not_started" | "in_progress" | "done" | "failed";
  analysis?: AnalysisEntry[];
  analysisError?: string;
  moveHistory?: MoveData[];
};

type ArrowCoords = [number, number];
type MoveCategory = "Best" | "Excellent" | "Good" | "Inaccuracy" | "Mistake" | "Blunder";
type ReviewRow = {
  index: number;
  ply: number;
  playedSAN: string;
  bestSAN: string;
  evalText: string;
  category: MoveCategory;
  comment: string;
  pvShort?: string;
};

const FILES = "abcdefgh";
const PIECE_MAP: Record<string, "pawn" | "bishop" | "knight" | "rook" | "queen" | "king"> = {
  p: "pawn",
  b: "bishop",
  n: "knight",
  r: "rook",
  q: "queen",
  k: "king",
};

function squareToCoords(square: string): ArrowCoords | null {
  if (square.length !== 2) {
    return null;
  }

  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]);
  if (file < 0 || Number.isNaN(rank) || rank < 1 || rank > 8) {
    return null;
  }

  return [file, 8 - rank];
}

function uciToArrow(uci?: string): { start: ArrowCoords; end: ArrowCoords } | null {
  if (!uci || uci.length < 4) {
    return null;
  }

  const from = squareToCoords(uci.slice(0, 2));
  const to = squareToCoords(uci.slice(2, 4));
  if (!from || !to) {
    return null;
  }

  return { start: from, end: to };
}

function toReadableMove(uci?: string): string {
  if (!uci) {
    return "—";
  }
  if (uci.length === 5) {
    return `${uci.slice(0, 4)}=${uci[4].toUpperCase()}`;
  }
  return uci;
}

function toReviewEval(scoreCp?: number): string {
  if (typeof scoreCp !== "number") {
    return "—";
  }
  const pawns = scoreCp / 100;
  const sign = pawns > 0 ? "+" : "";
  return `${sign}${pawns.toFixed(1)}`;
}

function getFenActiveColor(fen?: string): "white" | "black" {
  if (!fen) {
    return "white";
  }
  const active = fen.split(" ")[1];
  return active === "b" ? "black" : "white";
}

function normalizeToWhiteAdvantage(scoreCp: number, fenAfter?: string): number {
  const activeColor = getFenActiveColor(fenAfter);
  return activeColor === "white" ? scoreCp : -scoreCp;
}

function toSidePerspective(whiteAdvantage: number, side: "white" | "black"): number {
  return side === "white" ? whiteAdvantage : -whiteAdvantage;
}

function classifyMove(lossCp: number): MoveCategory {
  if (lossCp <= 20) return "Best";
  if (lossCp <= 60) return "Excellent";
  if (lossCp <= 130) return "Good";
  if (lossCp <= 260) return "Inaccuracy";
  if (lossCp <= 500) return "Mistake";
  return "Blunder";
}

function categoryColor(category: MoveCategory): string {
  switch (category) {
    case "Best":
      return "text-emerald-300 bg-emerald-500/20 border-emerald-400/40";
    case "Excellent":
      return "text-green-300 bg-green-500/20 border-green-400/40";
    case "Good":
      return "text-cyan-300 bg-cyan-500/20 border-cyan-400/40";
    case "Inaccuracy":
      return "text-yellow-300 bg-yellow-500/20 border-yellow-400/40";
    case "Mistake":
      return "text-orange-300 bg-orange-500/20 border-orange-400/40";
    case "Blunder":
      return "text-red-300 bg-red-500/20 border-red-400/40";
    default:
      return "text-white/80 bg-white/10 border-white/20";
  }
}

function categoryComment(category: MoveCategory, lossCp: number): string {
  switch (category) {
    case "Best":
      return "Сильнейший ход в позиции.";
    case "Excellent":
      return "Очень точный ход, почти без потери качества.";
    case "Good":
      return "Нормальный практичный ход.";
    case "Inaccuracy":
      return `Небольшая неточность (примерно ${Math.round(lossCp / 100)} пешки).`;
    case "Mistake":
      return `Серьёзная ошибка: позиция ухудшилась примерно на ${(lossCp / 100).toFixed(1)}.`;
    case "Blunder":
      return `Грубая ошибка: резкое ухудшение позиции на ${(lossCp / 100).toFixed(1)}+.`;
    default:
      return "Ход требует дополнительного анализа.";
  }
}

function toPseudoSAN(move?: MoveData): string {
  if (!move) {
    return "—";
  }

  try {
    const notation = getReadableMoveNotation(move);
    return notation.replace(/\s+/g, "");
  } catch {
    return "—";
  }
}

function getPieceFromFenAt(fen: string, coords: [number, number]) {
  const board = fen.split(" ")[0];
  const rows = board.split("/");
  const [x, y] = coords;
  const row = rows[y];
  if (!row) {
    return null;
  }

  let fileIndex = 0;
  for (const ch of row) {
    if (/\d/.test(ch)) {
      fileIndex += Number(ch);
      continue;
    }

    if (fileIndex === x) {
      const lower = ch.toLowerCase();
      const type = PIECE_MAP[lower];
      if (!type) {
        return null;
      }

      return {
        type,
        color: ch === lower ? "black" as const : "white" as const,
      };
    }

    fileIndex += 1;
  }

  return null;
}

function analysisToMoveData(entries: AnalysisEntry[]): MoveData[] {
  return entries
    .map((entry) => {
      const from = squareToCoords(entry.playedMoveUci.slice(0, 2));
      const to = squareToCoords(entry.playedMoveUci.slice(2, 4));
      if (!from || !to || !entry.fenAfter || !entry.fenBefore) {
        return null;
      }

      const piece = getPieceFromFenAt(entry.fenBefore, from);
      if (!piece) {
        return null;
      }

      return {
        from,
        to,
        FEN: entry.fenAfter,
        figure: piece,
      } satisfies MoveData;
    })
    .filter((move): move is MoveData => move !== null);
}

function uciToMoveData(uci: string | undefined, fenBefore: string): MoveData | null {
  if (!uci || uci.length < 4) {
    return null;
  }

  const from = squareToCoords(uci.slice(0, 2));
  const to = squareToCoords(uci.slice(2, 4));
  if (!from || !to) {
    return null;
  }

  const piece = getPieceFromFenAt(fenBefore, from);
  if (!piece) {
    return null;
  }

  return {
    from,
    to,
    FEN: fenBefore,
    figure: piece,
  };
}

export const AnalyzeScreen = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const history = useHistory();
  const [status, setStatus] = useState<AnalyzeResponse["status"]>("not_started");
  const [analysis, setAnalysis] = useState<AnalysisEntry[]>([]);
  const [analysisError, setAnalysisError] = useState<string | undefined>();
  const [moveHistory, setMoveHistory] = useState<MoveData[]>([]);
  const [selectedPly, setSelectedPly] = useState(0);

  useEffect(() => {
    let unmounted = false;
    let timer: number | undefined;

    const start = async () => {
      await fetch(`${API_PREFIX}/game-analysis/${gameId}/start`, { method: "POST" });
    };

    const poll = async () => {
      try {
        const response = await fetch(`${API_PREFIX}/game-analysis/${gameId}`);
        const data = await response.json() as AnalyzeResponse;
        if (!data.success || unmounted) {
          return;
        }

        setStatus(data.status);
        setAnalysisError(data.analysisError);
        setMoveHistory(Array.isArray(data.moveHistory) ? data.moveHistory : []);
        if (data.status === "done" && Array.isArray(data.analysis)) {
          setAnalysis(data.analysis);
          return;
        }

        timer = window.setTimeout(poll, 2000);
      } catch (error) {
        if (!unmounted) {
          timer = window.setTimeout(poll, 3000);
        }
      }
    };

    void (async () => {
      await start();
      await poll();
    })();

    return () => {
      unmounted = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [gameId]);

  const title = useMemo(() => {
    if (status === "done") return "Game Analysis";
    if (status === "failed") return "Analysis Failed";
    return "Analyzing Game...";
  }, [status]);

  useEffect(() => {
    if (analysis.length > 0) {
      setSelectedPly(1);
    }
  }, [analysis.length]);

  const initialFen = useMemo(() => {
    if (analysis.length > 0 && analysis[0]?.fenBefore) {
      return analysis[0].fenBefore;
    }
    return undefined;
  }, [analysis]);

  const normalizedMoveHistory = useMemo(() => {
    if (Array.isArray(moveHistory) && moveHistory.length > 0) {
      return moveHistory;
    }
    return analysisToMoveData(analysis);
  }, [analysis, moveHistory]);

  const reviewRows = useMemo<ReviewRow[]>(() => {
    if (!analysis.length) {
      return [];
    }

    return analysis.map((entry, index) => {
      const playedMove = normalizedMoveHistory[index];
      const bestMove = uciToMoveData(entry.bestMoveUci, entry.fenBefore);

      const playedScoreWhite = typeof entry.scoreCp === "number"
        ? normalizeToWhiteAdvantage(entry.scoreCp, entry.fenAfter)
        : undefined;

      const side = playedMove?.figure.color || getFenActiveColor(entry.fenBefore);
      const currPerspective = typeof playedScoreWhite === "number"
        ? toSidePerspective(playedScoreWhite, side)
        : undefined;

      const prevEntry = analysis[index - 1];
      const prevWhite = prevEntry && typeof prevEntry.scoreCp === "number"
        ? normalizeToWhiteAdvantage(prevEntry.scoreCp, prevEntry.fenAfter)
        : undefined;
      const prevPerspective = typeof prevWhite === "number"
        ? toSidePerspective(prevWhite, side)
        : undefined;

      const lossCp = index === 0 || typeof currPerspective !== "number" || typeof prevPerspective !== "number"
        ? 0
        : Math.max(0, Math.round(prevPerspective - currPerspective));

      const category = classifyMove(lossCp);
      const serious = category === "Mistake" || category === "Blunder";
      const bestSAN = toPseudoSAN(bestMove || undefined);

      return {
        index,
        ply: entry.ply,
        playedSAN: toPseudoSAN(playedMove),
        bestSAN,
        evalText: toReviewEval(entry.scoreCp),
        category,
        comment: categoryComment(category, lossCp),
        pvShort: serious && bestSAN !== "—" ? bestSAN : undefined,
      };
    });
  }, [analysis, normalizedMoveHistory]);

  const analyzedEntry = selectedPly > 0 ? analysis[selectedPly - 1] : undefined;
  const analyzedRow = selectedPly > 0 ? reviewRows[selectedPly - 1] : undefined;
  const boardFen = selectedPly > 0
    ? (normalizedMoveHistory[selectedPly - 1]?.FEN || initialFen)
    : initialFen;
  const playedArrow = uciToArrow(analyzedEntry?.playedMoveUci);
  const bestArrow = uciToArrow(analyzedEntry?.bestMoveUci);
  const boardArrows = useMemo(() => {
    const arrows: Array<{ start: ArrowCoords; end: ArrowCoords }> = [];
    if (bestArrow) {
      arrows.push(bestArrow);
    }
    return arrows;
  }, [bestArrow]);

  const canGoPrev = selectedPly > 0;
  const canGoNext = selectedPly < analysis.length;

  const goPrev = () => {
    if (!canGoPrev) {
      return;
    }
    setSelectedPly((prev) => prev - 1);
  };

  const goNext = () => {
    if (!canGoNext) {
      return;
    }
    setSelectedPly((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-back-primary text-white px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <button
            type="button"
            onClick={() => history.push(`/game/${gameId}`)}
            className="rounded-lg px-3 py-2 bg-white/10 border border-white/15 hover:bg-white/15 transition-colors"
          >
            Back to game
          </button>
        </div>

        {status === "in_progress" && (
          <div className="rounded-xl border border-white/15 bg-white/5 p-4 mb-4">
            <div className="text-white/80">Analysis is running. Please wait...</div>
          </div>
        )}

        {status === "failed" && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 mb-4 text-red-200">
            {analysisError || "Analysis failed"}
          </div>
        )}

        <div className="rounded-xl border border-white/15 bg-white/5 p-4 mb-4">
          <div className="text-sm text-white/70 mb-2">Moves in game: {normalizedMoveHistory.length}</div>
          <div className="text-sm text-white/70">Analysis entries: {analysis.length}</div>
        </div>

        {status === "done" && analysis.length > 0 && normalizedMoveHistory.length === 0 && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 mb-4 text-red-200">
            Invalid analysis data: moves are missing.
          </div>
        )}

        {!initialFen && status === "done" && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 mb-4 text-red-200">
            Invalid analysis data: initial FEN is missing.
          </div>
        )}

        {analysis.length > 0 && initialFen && (
          <div className="rounded-xl border border-white/15 bg-white/5 p-4 mb-4">
            <div className="max-w-[560px] mx-auto">
              <ChessboardWrap
                renderChessboard={(wrapWidth) => (
                  <ChessBoard
                    FEN={boardFen || ""}
                    onChange={() => {}}
                    onEndGame={() => {}}
                    viewOnly={true}
                    moveHighlight={playedArrow ? [playedArrow.start, playedArrow.end] : undefined}
                    moveArrows={boardArrows}
                    config={{
                      squareSize: wrapWidth / 8,
                    }}
                  />
                )}
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={!canGoPrev}
                className="rounded-lg px-3 py-2 bg-white/10 border border-white/15 hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev move
              </button>
              <div className="text-sm text-white/80 min-w-[120px] text-center">
                {selectedPly} / {analysis.length}
              </div>
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="rounded-lg px-3 py-2 bg-white/10 border border-white/15 hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next move →
              </button>
            </div>
            <div className="mt-3 text-center text-sm text-white/70">
              Played: <span className="font-mono">{analyzedRow?.playedSAN || "—"}</span>
              {" · "}
              Best: <span className="font-mono">{analyzedRow?.bestSAN || "—"}</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-sm">
              {analyzedRow?.category && (
                <span className={`px-2 py-1 rounded-md border ${categoryColor(analyzedRow.category)}`}>
                  {analyzedRow.category}
                </span>
              )}
              <span className="text-white/80">Eval: {analyzedRow?.evalText || "—"}</span>
            </div>
            <div className="mt-2 text-center text-sm text-white/70">
              {analyzedRow?.comment || "Сделайте ход вперёд, чтобы увидеть review."}
            </div>
            {analyzedRow?.pvShort && (
              <div className="mt-1 text-center text-sm text-red-200">
                Лучше было: <span className="font-mono">{analyzedRow.pvShort}</span>
              </div>
            )}
          </div>
        )}

        {analysis.length > 0 && (
          <div className="rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">Move</th>
                  <th className="text-left px-3 py-2">Best</th>
                  <th className="text-left px-3 py-2">Review</th>
                  <th className="text-left px-3 py-2">Eval</th>
                </tr>
              </thead>
              <tbody>
                {reviewRows.map((row) => (
                  <tr
                    key={row.ply}
                    className={`border-t border-white/10 cursor-pointer ${row.index === selectedPly - 1 ? "bg-white/10" : "hover:bg-white/5"}`}
                    onClick={() => setSelectedPly(row.index + 1)}
                  >
                    <td className="px-3 py-2">{row.ply}</td>
                    <td className="px-3 py-2 font-mono">{row.playedSAN}</td>
                    <td className="px-3 py-2 font-mono">{row.bestSAN}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-md border ${categoryColor(row.category)}`}>{row.category}</span>
                    </td>
                    <td className="px-3 py-2">{row.evalText}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
