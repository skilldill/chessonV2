import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";
import { ChessBoard } from "react-chessboard-ui";
import { AnalysisEvaluationChart } from "../../components/AnalysisEvaluationChart/AnalysisEvaluationChart";
import { getChessboardConfig } from "../../components/ChessBoardConfigs/ChessBoardConfigs";
import { useAppearance } from "../../hooks/useAppearance";
import { useGameAnalysis } from "../../hooks/useGameAnalysis";
import { useScreenSize } from "../../hooks/useScreenSize";
import type { AnalysisSideSummary, AnalyzedMove, MoveQuality } from "../../types/analysis";

const FILTERS: Array<{ value: MoveQuality | "all"; labelKey: string }> = [
  { value: "all", labelKey: "analysis.filter.all" },
  { value: "blunder", labelKey: "analysis.filter.blunder" },
  { value: "bad", labelKey: "analysis.filter.bad" },
  { value: "good", labelKey: "analysis.filter.good" },
  { value: "excellent", labelKey: "analysis.filter.excellent" },
];

const QUALITY_CLASSES: Record<MoveQuality, string> = {
  excellent: "bg-emerald-500/16 text-emerald-200 border-emerald-400/25",
  good: "bg-sky-500/16 text-sky-200 border-sky-400/25",
  normal: "bg-white/8 text-white/55 border-white/10",
  bad: "bg-amber-500/16 text-amber-200 border-amber-400/25",
  blunder: "bg-red-500/16 text-red-200 border-red-400/25",
};

export function GameAnalysisScreen() {
  const { t } = useTranslation();
  const { gameId } = useParams<{ gameId: string }>();
  const history = useHistory();
  const screenSize = useScreenSize();
  const { chessboardTheme } = useAppearance();
  const chessboardConfig = getChessboardConfig(chessboardTheme);
  const { status, progress, analysis, error, retry } = useGameAnalysis(gameId);
  const [selectedPly, setSelectedPly] = useState<number | null>(null);
  const [filter, setFilter] = useState<MoveQuality | "all">("all");
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const historyListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.removeItem("gameData");
  }, []);

  const handleGoHome = () => {
    localStorage.removeItem("gameData");
    history.push("/main");
  };

  const handleShareGame = async () => {
    const shareUrl = `${window.location.origin}/analyze/${gameId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsShareCopied(true);
      window.setTimeout(() => setIsShareCopied(false), 1600);
    } catch {
      setIsShareCopied(false);
    }
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

  useEffect(() => {
    if (selectedPly === null) {
      return;
    }

    const selectedMoveElement = historyListRef.current?.querySelector<HTMLElement>(
      `[data-analysis-ply="${selectedPly}"]`,
    );

    selectedMoveElement?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [groupedMoves, selectedPly]);

  if (status === "loading" || status === "running" || status === "idle") {
    return (
      <AnalysisPageShell onGoHome={handleGoHome} onShareGame={handleShareGame} isShareCopied={isShareCopied}>
        <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4F39F6] border-t-transparent" />
          <div>
            <h1 className="text-xl font-semibold text-white">{t("analysis.title")}</h1>
            <p className="mt-2 text-sm text-white/60">
              {progress?.total
                ? t("analysis.loadingProgress", { current: progress.current, total: progress.total })
                : t("analysis.loading")}
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
      <AnalysisPageShell onGoHome={handleGoHome} onShareGame={handleShareGame} isShareCopied={isShareCopied}>
        <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-white">{t("analysis.failedTitle")}</h1>
          <p className="text-sm text-white/60">{error || t("analysis.failedText")}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-md bg-[#4F39F6] px-5 py-3 text-sm font-semibold text-white transition active:scale-95"
          >
            {t("analysis.retry")}
          </button>
        </div>
      </AnalysisPageShell>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <AnalysisPageShell onGoHome={handleGoHome} onShareGame={handleShareGame} isShareCopied={isShareCopied}>
      <div className="mx-auto grid w-full max-w-[1500px] gap-5 lg:grid-cols-[minmax(660px,780px)_minmax(380px,1fr)] lg:items-start">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">{t("analysis.position")}</h2>
              <div className="text-sm text-white/45">{t("analysis.bestMoveArrowHint")}</div>
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
          </div>

          <AnalysisEvaluationChart
            points={analysis.graph}
            selectedPly={selectedPly}
            onPointClick={(point) => setSelectedPly(point.ply)}
          />
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {analysis.summary.bestMoveText && (
              <MomentButton
                title={t("analysis.bestMoveOfGame")}
                value={analysis.summary.bestMoveText}
                tone="green"
                onClick={() => analysis.summary.bestMovePly && setSelectedPly(analysis.summary.bestMovePly)}
              />
            )}
            {keyMomentMove && (
              <MomentButton
                title={t("analysis.keyBlunder")}
                value={`${formatMovePrefix(keyMomentMove)} ${keyMomentMove.notation}`}
                tone="red"
                onClick={() => setSelectedPly(keyMomentMove.ply)}
              />
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CountersBlock title={t("analysis.white")} counters={analysis.counters.white} />
            <CountersBlock title={t("analysis.black")} counters={analysis.counters.black} />
          </div>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">{t("analysis.moveHistory")}</h2>
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
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div ref={historyListRef} className="grid max-h-[680px] gap-2 overflow-y-auto pr-1">
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

function AnalysisPageShell({
  children,
  onGoHome,
  onShareGame,
  isShareCopied,
}: {
  children: ReactNode;
  onGoHome: () => void;
  onShareGame: () => void;
  isShareCopied: boolean;
}) {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-back-primary text-white">
      <div className="sticky left-0 right-0 top-0 z-30 border-b border-white/10 bg-black/25 backdrop-blur-md">
        <div className="relative mx-auto flex h-14 w-full max-w-[1500px] items-center justify-center px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onGoHome}
            className="absolute left-4 flex h-9 items-center gap-1 rounded-md px-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 active:scale-[0.98] sm:left-6 lg:left-8"
          >
            <span className="h-2.5 w-2.5 rotate-45 border-b-2 border-l-2 border-current" aria-hidden="true" />
            <span className="hidden sm:inline">{t("analysis.goHome")}</span>
          </button>

          <img src="/chesson-logo.svg" alt="Chesson" className="h-6 w-auto" />

          <button
            type="button"
            onClick={onShareGame}
            className="absolute right-4 flex h-9 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 active:scale-[0.98] sm:right-6 lg:right-8"
          >
            <LinkIcon />
            {isShareCopied ? t("analysis.shareCopied") : t("analysis.shareGame")}
          </button>
        </div>
      </div>
      <div className="px-4 py-5 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}

function LinkIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 13.5L14 9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.3 7.7L10.8 6.2C12.5 4.5 15.3 4.5 17 6.2C18.7 7.9 18.7 10.7 17 12.4L15.5 13.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14.7 16.3L13.2 17.8C11.5 19.5 8.7 19.5 7 17.8C5.3 16.1 5.3 13.3 7 11.6L8.5 10.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-white/80">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Counter label={t("analysis.accuracyPercent")} value={counters.accuracy} className="text-white" />
        <Counter label={t("analysis.averageLossCp")} value={counters.averageLossCp} className="text-white" />
        <Counter label={t("analysis.excellentMoves")} value={counters.excellent} className="text-emerald-200" />
        <Counter label={t("analysis.goodMoves")} value={counters.good} className="text-sky-200" />
        <Counter label={t("analysis.badMoves")} value={counters.bad} className="text-amber-200" />
        <Counter label={t("analysis.blunders")} value={counters.blunder} className="text-red-200" />
      </div>
    </div>
  );
}

function Counter({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-md bg-black/20 p-2.5">
      <div className="text-sm text-white/45">{label}</div>
      <div className={`text-2xl font-semibold ${className}`}>{value}</div>
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
  const { t } = useTranslation();

  if (!move) {
    return <div className="min-h-[74px] rounded-md border border-transparent" />;
  }

  const qualityDescription = getQualityDescription(move, t);

  return (
    <button
      type="button"
      data-analysis-ply={move.ply}
      onClick={onClick}
      className={`min-w-0 rounded-md border p-2 text-left transition flex flex-col justify-start ${
        selected ? "border-[#4F39F6] bg-[#4F39F6]/20" : "border-transparent bg-white/[0.03] hover:bg-white/8"
      }`}
    >
      <span className="block min-w-0 text-sm text-white">
        <span className="text-[18px]">{move.notation}</span>
        <span className="ml-2 text-sm text-white/35">{move.afterScore > 0 ? "+" : ""}{move.afterScore}</span>
        <span className="mt-1 block truncate text-sm text-white/55" title={qualityDescription}>
          {qualityDescription}
        </span>
        {move.bestMove && (
          <span className="mt-1 block truncate text-sm text-emerald-100/75" title={t("analysis.bestMoveTitle", { move: move.bestMove.notation })}>
            {t("analysis.bestMoveShort", { move: move.bestMove.notation })}
          </span>
        )}
      </span>
      {move.quality !== 'normal' && (
        <span className={`mt-2 inline-flex rounded border px-2 py-1 text-sm font-semibold max-w-min ${QUALITY_CLASSES[move.quality]}`}>
          {t(`analysis.quality.${move.quality}`)}
        </span>
      )}
    </button>
  );
}

function formatMovePrefix(move: Pick<AnalyzedMove, "moveNumber" | "color">): string {
  return move.color === "white" ? `${move.moveNumber}.` : `${move.moveNumber}...`;
}

function getQualityDescription(move: AnalyzedMove, t: ReturnType<typeof useTranslation>["t"]): string {
  if (move.lossCp > 0) {
    return t(`analysis.qualityDescription.${move.quality}`, { lossCp: move.lossCp });
  }

  return t(`analysis.qualityDescription.${move.quality}.zero`);
}
