import { useEffect, useMemo, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { ChessBoard } from "react-chessboard-ui";
import { API_PREFIX } from "../../constants/api";
import type { MoveData } from "../../types";
import { ChessboardWrap } from "../../components/ChessboardWrap/ChessboardWrap";

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

  const analyzedEntry = selectedPly > 0 ? analysis[selectedPly - 1] : undefined;
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
              Played: <span className="font-mono">{toReadableMove(analyzedEntry?.playedMoveUci)}</span>
              {" · "}
              Best: <span className="font-mono">{toReadableMove(analyzedEntry?.bestMoveUci)}</span>
            </div>
          </div>
        )}

        {analysis.length > 0 && (
          <div className="rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">Played</th>
                  <th className="text-left px-3 py-2">Best</th>
                  <th className="text-left px-3 py-2">Score (cp)</th>
                  <th className="text-left px-3 py-2">Depth</th>
                </tr>
              </thead>
              <tbody>
                {analysis.map((entry, index) => (
                  <tr
                    key={entry.ply}
                    className={`border-t border-white/10 cursor-pointer ${index === selectedPly - 1 ? "bg-white/10" : "hover:bg-white/5"}`}
                    onClick={() => setSelectedPly(index + 1)}
                  >
                    <td className="px-3 py-2">{entry.ply}</td>
                    <td className="px-3 py-2 font-mono">{toReadableMove(entry.playedMoveUci)}</td>
                    <td className="px-3 py-2 font-mono">{toReadableMove(entry.bestMoveUci)}</td>
                    <td className="px-3 py-2">{entry.scoreCp ?? "—"}</td>
                    <td className="px-3 py-2">{entry.depth ?? "—"}</td>
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
