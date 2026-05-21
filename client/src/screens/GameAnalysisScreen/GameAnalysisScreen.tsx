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
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);

  useEffect(() => {
    localStorage.removeItem("gameData");
  }, []);

  const handleGoHome = () => {
    localStorage.removeItem("gameData");
    history.push("/main");
  };


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

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
  const preferredBoardSize = screenSize === "S" ? 52 : screenSize === "M" ? 72 : 88;
  const verticalReserve = screenSize === "L" ? 230 : 180;
  const maxBoardSizeByHeight = Math.floor(Math.max(320, viewportHeight - verticalReserve) / 8);
  const boardSize = Math.max(36, Math.min(preferredBoardSize, maxBoardSizeByHeight));
  const filteredMoves = useMemo(() => {
    if (!analysis) return [];
    if (filter === "all") return analysis.moves;
    return analysis.moves.filter((move) => move.quality === filter);
  }, [analysis, filter]);
  const groupedMoves = useMemo(() => groupMovesByNumber(filteredMoves), [filteredMoves]);
  const keyMomentMove = useMemo(
    () => analysis?.moves.find((move) => move.ply === analysis.summary.keyMomentPly) ?? null,
    [analysis],
  );

  if (status === "loading" || status === "running" || status === "idle") {
    return (
      <AnalysisPageShell onGoHome={handleGoHome}>
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
      <AnalysisPageShell onGoHome={handleGoHome}>
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
    <AnalysisPageShell onGoHome={handleGoHome}>
      <div className="mx-auto grid w-full max-w-[1500px] gap-5 lg:grid-cols-[minmax(660px,780px)_minmax(380px,1fr)] lg:items-start">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">Позиция</h2>
              <div className="text-sm text-white/45">Стрелка показывает лучший ход</div>
            </div>
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
                    arrowColor: 'oklch(79.2% 0.209 151.711)'
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

          <AnalysisEvaluationChart
            points={analysis.graph}
            selectedPly={selectedPly}
            onPointClick={(point) => setSelectedPly(point.ply)}
          />
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-white">Анализ партии</h1>
            {/* <p className="text-sm text-white/65">{analysis.summary.text}</p> */}
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {analysis.summary.bestMoveText && (
              <MomentButton
                title="Лучший ход партии"
                value={analysis.summary.bestMoveText}
                tone="green"
                onClick={() => analysis.summary.bestMovePly && setSelectedPly(analysis.summary.bestMovePly)}
              />
            )}
            {keyMomentMove && (
              <MomentButton
                title="Главный зевок"
                value={`${formatMovePrefix(keyMomentMove)} ${keyMomentMove.notation}`}
                tone="red"
                onClick={() => setSelectedPly(keyMomentMove.ply)}
              />
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CountersBlock title="Белые" counters={analysis.counters.white} />
            <CountersBlock title="Черные" counters={analysis.counters.black} />
          </div>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">История ходов</h2>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    className={`rounded-md border px-3 py-1.5 text-sm font-semibold transition ${
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

            <div className="grid max-h-[680px] gap-2 overflow-y-auto pr-1">
              {groupedMoves.map((moveGroup) => (
                <MovePairRow
                  key={moveGroup.moveNumber}
                  moveNumber={moveGroup.moveNumber}
                  whiteMove={moveGroup.whiteMove}
                  blackMove={moveGroup.blackMove}
                  selectedPly={selectedPly}
                  onSelectMove={setSelectedPly}
                />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AnalysisPageShell>
  );
}

function AnalysisPageShell({ children, onGoHome }: { children: ReactNode; onGoHome: () => void }) {
  return (
    <main className="min-h-screen bg-back-primary px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto mb-5 flex w-full max-w-[1500px] items-center justify-between">
        <button
          type="button"
          onClick={onGoHome}
          className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10"
        >
          На главную
        </button>
      </div>
      {children}
    </main>
  );
}

function MomentButton({
  title,
  value,
  tone,
  onClick,
}: {
  title: string;
  value: string;
  tone: "green" | "red";
  onClick: () => void;
}) {
  const toneClass = tone === "green"
    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
    : "border-red-400/25 bg-red-500/10 text-red-100 hover:bg-red-500/15";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition ${toneClass}`}
    >
      <div className="text-sm font-semibold opacity-85">{title}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </button>
  );
}

function CountersBlock({ title, counters }: { title: string; counters: AnalysisSideSummary }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-white/80">{title}</h2>
        <div className="rounded-md bg-white/8 px-2 py-1 text-right text-sm font-semibold text-white">
          <div>Accuracy {counters.accuracy}%</div>
          <div className="mt-0.5 text-sm font-medium text-white/70">{counters.accuracyLabel}</div>
          <div className="mt-0.5 text-sm font-medium text-white/55">
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
    <div className="rounded-md bg-black/20 p-2.5">
      <div className={`text-lg font-semibold ${className}`}>{value}</div>
      <div className="text-sm text-white/45">{label}</div>
    </div>
  );
}

type MoveGroup = {
  moveNumber: number;
  whiteMove?: AnalyzedMove;
  blackMove?: AnalyzedMove;
};

function groupMovesByNumber(moves: AnalyzedMove[]): MoveGroup[] {
  const groups = new Map<number, MoveGroup>();

  for (const move of moves) {
    const group = groups.get(move.moveNumber) ?? { moveNumber: move.moveNumber };

    if (move.color === "white") {
      group.whiteMove = move;
    } else {
      group.blackMove = move;
    }

    groups.set(move.moveNumber, group);
  }

  return Array.from(groups.values()).sort((a, b) => a.moveNumber - b.moveNumber);
}

function MovePairRow({
  moveNumber,
  whiteMove,
  blackMove,
  selectedPly,
  onSelectMove,
}: {
  moveNumber: number;
  whiteMove?: AnalyzedMove;
  blackMove?: AnalyzedMove;
  selectedPly: number | null;
  onSelectMove: (ply: number) => void;
}) {
  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)_minmax(0,1fr)] gap-2 rounded-md border border-white/10 bg-black/15 p-2">
      <div className="pt-2 text-right text-sm font-semibold text-white/40">{moveNumber}.</div>
      <MoveCell
        move={whiteMove}
        selected={selectedPly === whiteMove?.ply}
        onClick={() => whiteMove && onSelectMove(whiteMove.ply)}
      />
      <MoveCell
        move={blackMove}
        selected={selectedPly === blackMove?.ply}
        onClick={() => blackMove && onSelectMove(blackMove.ply)}
      />
    </div>
  );
}

function MoveCell({ move, selected, onClick }: { move?: AnalyzedMove; selected: boolean; onClick: () => void }) {
  if (!move) {
    return <div className="min-h-[74px] rounded-md border border-transparent" />;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-md border p-2 text-left transition flex flex-col justify-start ${
        selected ? "border-[#4F39F6] bg-[#4F39F6]/20" : "border-transparent bg-white/[0.03] hover:bg-white/8"
      }`}
    >
      <span className="block min-w-0 text-sm text-white">
        <span className="font-semibold">{move.notation}</span>
        <span className="ml-2 text-sm text-white/35">{move.afterScore > 0 ? "+" : ""}{move.afterScore}</span>
        <span className="mt-1 block truncate text-sm text-white/55" title={move.qualityDescription}>
          {move.qualityDescription}
        </span>
        {move.bestMove && (
          <span className="mt-1 block truncate text-sm text-emerald-100/75" title={`Лучший: ${move.bestMove.notation}`}>
            Лучший: {move.bestMove.notation}
          </span>
        )}
      </span>
      {move.quality !== 'normal' && (
        <span className={`mt-2 inline-flex rounded border px-2 py-1 text-sm font-semibold max-w-min ${QUALITY_CLASSES[move.quality]}`}>
          {QUALITY_LABELS[move.quality]}
        </span>
      )}
    </button>
  );
}

function formatMovePrefix(move: Pick<AnalyzedMove, "moveNumber" | "color">): string {
  return move.color === "white" ? `${move.moveNumber}.` : `${move.moveNumber}...`;
}
