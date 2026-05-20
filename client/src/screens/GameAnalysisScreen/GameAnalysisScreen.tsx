import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useHistory, useParams } from "react-router-dom";
import { ChessBoard } from "react-chessboard-ui";
import { AnalysisEvaluationChart } from "../../components/AnalysisEvaluationChart/AnalysisEvaluationChart";
import { getChessboardConfig } from "../../components/ChessBoardConfigs/ChessBoardConfigs";
import { useAppearance } from "../../hooks/useAppearance";
import { useGameAnalysis } from "../../hooks/useGameAnalysis";
import { useScreenSize } from "../../hooks/useScreenSize";
import type { AnalysisSideSummary, AnalyzedMove, MoveQuality } from "../../types/analysis";

const FILTERS: Array<{ value: MoveQuality | "all"; label: string }> = [
  { value: "all", label: "Все" },
  { value: "blunder", label: "Зевки" },
  { value: "bad", label: "Плохие" },
  { value: "good", label: "Хорошие" },
  { value: "excellent", label: "Отличные" },
];

const QUALITY_LABELS: Record<MoveQuality, string> = {
  excellent: "Отличный",
  good: "Хороший",
  normal: "Обычный",
  bad: "Плохой",
  blunder: "Зевок",
};

const QUALITY_CLASSES: Record<MoveQuality, string> = {
  excellent: "bg-emerald-500/16 text-emerald-200 border-emerald-400/25",
  good: "bg-sky-500/16 text-sky-200 border-sky-400/25",
  normal: "bg-white/8 text-white/55 border-white/10",
  bad: "bg-amber-500/16 text-amber-200 border-amber-400/25",
  blunder: "bg-red-500/16 text-red-200 border-red-400/25",
};

export function GameAnalysisScreen() {
  const { gameId } = useParams<{ gameId: string }>();
  const history = useHistory();
  const screenSize = useScreenSize();
  const { chessboardTheme } = useAppearance();
  const chessboardConfig = getChessboardConfig(chessboardTheme);
  const { status, progress, analysis, error, retry } = useGameAnalysis(gameId);
  const [selectedPly, setSelectedPly] = useState<number | null>(null);
  const [filter, setFilter] = useState<MoveQuality | "all">("all");

  useEffect(() => {
    if (!analysis || selectedPly !== null) {
      return;
    }

    setSelectedPly(analysis.summary.keyMomentPly ?? analysis.moves.at(-1)?.ply ?? 0);
  }, [analysis, selectedPly]);

  useEffect(() => {
    if (!analysis) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tagName = target.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
          return;
        }
      }

      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      setSelectedPly((current) => {
        const maxPly = analysis.moves.length;
        const currentPly = current ?? maxPly;
        return event.key === "ArrowLeft"
          ? Math.max(0, currentPly - 1)
          : Math.min(maxPly, currentPly + 1);
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [analysis]);

  const selectedMove = useMemo(
    () => analysis?.moves.find((move) => move.ply === selectedPly) ?? null,
    [analysis, selectedPly],
  );
  const selectedFen = selectedMove?.fenAfter ?? analysis?.initialFEN;
  const bestMoveArrow = selectedMove?.bestMove
    ? [{ start: selectedMove.bestMove.from, end: selectedMove.bestMove.to }]
    : [];
  const selectedMoveHighlight = selectedMove
    ? [selectedMove.from, selectedMove.to] as [[number, number], [number, number]]
    : undefined;
  const boardSize = screenSize === "S" ? 36 : screenSize === "M" ? 44 : 52;
  const filteredMoves = useMemo(() => {
    if (!analysis) return [];
    if (filter === "all") return analysis.moves;
    return analysis.moves.filter((move) => move.quality === filter);
  }, [analysis, filter]);

  if (status === "loading" || status === "running" || status === "idle") {
    return (
      <AnalysisPageShell onBack={() => history.goBack()}>
        <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4F39F6] border-t-transparent" />
          <div>
            <h1 className="text-xl font-semibold text-white">Анализ партии</h1>
            <p className="mt-2 text-sm text-white/60">
              {progress?.total
                ? `Анализируем ${progress.current} из ${progress.total} ходов`
                : "Готовим анализ партии"}
            </p>
          </div>
          <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#4F39F6] transition-all duration-300"
              style={{
                width: progress?.total ? `${Math.round((progress.current / progress.total) * 100)}%` : "12%",
              }}
            />
          </div>
        </div>
      </AnalysisPageShell>
    );
  }

  if (status === "failed") {
    return (
      <AnalysisPageShell onBack={() => history.goBack()}>
        <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-white">Анализ не готов</h1>
          <p className="text-sm text-white/60">{error || "Не удалось выполнить анализ партии"}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-md bg-[#4F39F6] px-5 py-3 text-sm font-semibold text-white transition active:scale-95"
          >
            Повторить анализ
          </button>
        </div>
      </AnalysisPageShell>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <AnalysisPageShell onBack={() => history.goBack()}>
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <header className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold text-white">Анализ партии</h1>
            <p className="text-sm text-white/65">{analysis.summary.text}</p>
          </header>

          {analysis.summary.bestMoveText && (
            <button
              type="button"
              onClick={() => analysis.summary.bestMovePly && setSelectedPly(analysis.summary.bestMovePly)}
              className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4 text-left transition hover:bg-emerald-500/15"
            >
              <div className="text-sm font-semibold text-emerald-100">Лучший ход партии</div>
              <div className="mt-1 text-lg font-semibold text-white">{analysis.summary.bestMoveText}</div>
            </button>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <CountersBlock title="Белые" counters={analysis.counters.white} />
            <CountersBlock title="Черные" counters={analysis.counters.black} />
          </div>

          <AnalysisEvaluationChart
            points={analysis.graph}
            selectedPly={selectedPly}
            onPointClick={(point) => setSelectedPly(point.ply)}
          />

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">История ходов</h2>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                      filter === item.value
                        ? "border-[#4F39F6] bg-[#4F39F6] text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {filteredMoves.map((move) => (
                <MoveRow
                  key={move.ply}
                  move={move}
                  selected={selectedPly === move.ply}
                  onClick={() => setSelectedPly(move.ply)}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="mb-3 text-base font-semibold text-white">Позиция</h2>
            {selectedFen && (
              <div className="mx-auto w-fit overflow-hidden rounded-md">
                <ChessBoard
                  FEN={selectedFen}
                  onChange={() => {}}
                  onEndGame={() => {}}
                  viewOnly={true}
                  moveArrows={bestMoveArrow}
                  moveHighlight={selectedMoveHighlight}
                  config={{
                    squareSize: boardSize,
                    ...chessboardConfig,
                  }}
                />
              </div>
            )}
            <div className="mt-3 text-sm text-white/65">
              {selectedMove
                ? `${formatMovePrefix(selectedMove)} ${selectedMove.notation}: ${QUALITY_LABELS[selectedMove.quality]}`
                : "Начальная позиция"}
            </div>
            {selectedMove?.bestMove && (
              <div className="mt-2 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                Лучший ход: <span className="font-semibold">{selectedMove.bestMove.notation}</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </AnalysisPageShell>
  );
}

function AnalysisPageShell({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  return (
    <main className="min-h-screen bg-back-primary px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto mb-5 flex w-full max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10"
        >
          Назад
        </button>
      </div>
      {children}
    </main>
  );
}

function CountersBlock({ title, counters }: { title: string; counters: AnalysisSideSummary }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white/80">{title}</h2>
        <div className="rounded-md bg-white/8 px-2.5 py-1 text-right text-xs font-semibold text-white">
          <div>Accuracy {counters.accuracy}%</div>
          <div className="mt-0.5 text-[11px] font-medium text-white/70">{counters.accuracyLabel}</div>
          <div className="mt-0.5 text-[11px] font-medium text-white/55">
            Average loss {counters.averageLossCp} cp
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Counter label="Отличные" value={counters.excellent} className="text-emerald-200" />
        <Counter label="Хорошие" value={counters.good} className="text-sky-200" />
        <Counter label="Плохие" value={counters.bad} className="text-amber-200" />
        <Counter label="Зевки" value={counters.blunder} className="text-red-200" />
      </div>
    </div>
  );
}

function Counter({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-md bg-black/20 p-3">
      <div className={`text-xl font-semibold ${className}`}>{value}</div>
      <div className="text-xs text-white/45">{label}</div>
    </div>
  );
}

function MoveRow({ move, selected, onClick }: { move: AnalyzedMove; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-md border p-3 text-left transition ${
        selected ? "border-[#4F39F6] bg-[#4F39F6]/20" : "border-white/10 bg-black/15 hover:bg-white/8"
      }`}
    >
      <span className="min-w-0 text-sm text-white">
        <span className="mr-2 text-white/45">{formatMovePrefix(move)}</span>
        <span className="font-semibold">{move.notation}</span>
        <span className="ml-2 text-xs text-white/35">{move.afterScore > 0 ? "+" : ""}{move.afterScore}</span>
        <span className="mt-1 block text-xs text-white/55">
          {move.qualityDescription}
        </span>
        {move.bestMove && (
          <span className="mt-1 block text-xs text-emerald-100/75">
            Лучший: {move.bestMove.notation}
          </span>
        )}
      </span>
      <span className={`shrink-0 rounded border px-2 py-1 text-xs font-semibold ${QUALITY_CLASSES[move.quality]}`}>
        {QUALITY_LABELS[move.quality]}
      </span>
    </button>
  );
}

function formatMovePrefix(move: Pick<AnalyzedMove, "moveNumber" | "color">): string {
  return move.color === "white" ? `${move.moveNumber}.` : `${move.moveNumber}...`;
}
