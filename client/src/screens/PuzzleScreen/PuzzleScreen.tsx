import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { ChessBoard, JSChessEngine } from "react-chessboard-ui";
import { ChessboardWrap } from "../../components/ChessboardWrap/ChessboardWrap";
import { GameScreenControls } from "../../components/GameScreenControls/GameScreenControls";
import { HistoryMoves } from "../../components/HistoryMoves/HistoryMoves";
import { getChessboardConfig } from "../../components/ChessBoardConfigs/ChessBoardConfigs";
import { API_PREFIX } from "../../constants/api";
import { useAppearance } from "../../hooks/useAppearance";
import { usePuzzle } from "../../hooks/usePuzzle";
import { useScreenHeightForChessboard } from "../../hooks/useScreenHeightForChessboard";
import type { MoveData } from "../../types";
import type { PuzzleListItem } from "../../types/puzzle";

import AiIconPNG from "../../assets/ai-icon.png";
import CrossMarkRedPNG from "../../assets/cross-mark.png";
import { useTranslation } from "react-i18next";

export function PuzzleScreen() {
  const { t } = useTranslation();
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const history = useHistory();
  const { chessboardTheme } = useAppearance();
  const gridColsClass = useScreenHeightForChessboard();
  const chessboardConfig = getChessboardConfig(chessboardTheme);
  const [nextPuzzleId, setNextPuzzleId] = useState<string | null>(null);
  const [ratingStatus, setRatingStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [hasRated, setHasRated] = useState(false);
  const [isHistoryMode, setIsHistoryMode] = useState(false);
  const [selectedHistoryMove, setSelectedHistoryMove] = useState<MoveData>();
  const invalidPuzzleIdsRef = useRef(new Set<string>());
  const handleInvalidPuzzle = useCallback(async (invalidPuzzleId: string) => {
    invalidPuzzleIdsRef.current.add(invalidPuzzleId);

    void fetch(`${API_PREFIX}/puzzles/${invalidPuzzleId}/report-invalid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Client validation failed before puzzle render" }),
    }).catch(() => undefined);

    try {
      const exclude = encodeURIComponent([...invalidPuzzleIdsRef.current].join(","));
      const response = await fetch(`${API_PREFIX}/puzzles/random?status=draft,published&exclude=${exclude}`);
      const data = await response.json();

      if (response.ok && data.success && data.puzzle?.id && data.puzzle.id !== puzzleId) {
        history.replace(`/puzzles/${data.puzzle.id}`);
        return;
      }
    } catch {
      // Keep the fallback below.
    }

    history.replace("/puzzles");
  }, [history, puzzleId]);
  const {
    status,
    error,
    puzzle,
    boardFen,
    playerColor,
    movesHistory,
    externalChangeMove,
    hintArrow,
    boardResetVersion,
    message,
    isLocked,
    isSolved,
    submitMove,
    requestHint,
    reload,
  } = usePuzzle(puzzleId, { onInvalidPuzzle: handleInvalidPuzzle });

  const reverseBoard = playerColor === "black";
  const initialBoardFen = boardFen || puzzle?.initialFEN || "";
  const mappedHintArrow = useMemo(() => {
    if (!hintArrow || isHistoryMode) {
      return [];
    }

    if (playerColor !== "black") {
      return [{ start: hintArrow.from, end: hintArrow.to }];
    }

    return [{ start: reverseCoords(hintArrow.from), end: reverseCoords(hintArrow.to) }];
  }, [hintArrow, isHistoryMode, playerColor]);

  const selectedHistoryMoveHighlight = useMemo(() => {
    if (!selectedHistoryMove) {
      return undefined;
    }

    if (playerColor === "black") {
      const reversedMove = JSChessEngine.reverseMove(selectedHistoryMove) as MoveData;
      return [reversedMove.from, reversedMove.to] as [[number, number], [number, number]];
    }

    return [selectedHistoryMove.from, selectedHistoryMove.to] as [[number, number], [number, number]];
  }, [playerColor, selectedHistoryMove]);

  useEffect(() => {
    let ignore = false;

    async function loadNextPuzzle() {
      try {
        const response = await fetch(`${API_PREFIX}/puzzles?status=draft,published&limit=100`);
        const data = await response.json();
        if (!response.ok || !data.success) return;

        const puzzles = data.puzzles as PuzzleListItem[];
        const currentIndex = puzzles.findIndex((item) => item.id === puzzleId);
        const nextPuzzle = currentIndex >= 0
          ? puzzles[currentIndex + 1] ?? puzzles.find((item) => item.id !== puzzleId)
          : puzzles.find((item) => item.id !== puzzleId);

        if (!ignore) {
          setNextPuzzleId(nextPuzzle?.id ?? null);
        }
      } catch {
        if (!ignore) {
          setNextPuzzleId(null);
        }
      }
    }

    void loadNextPuzzle();

    return () => {
      ignore = true;
    };
  }, [puzzleId]);

  useEffect(() => {
    setIsHistoryMode(false);
    setSelectedHistoryMove(undefined);
    setRatingStatus("idle");
    setHasRated(false);
    invalidPuzzleIdsRef.current.delete(puzzleId);
  }, [puzzleId]);

  const handleLeave = useCallback(() => {
    history.push("/");
  }, [history]);

  const handleNextPuzzle = useCallback(() => {
    async function openRandomPuzzle() {
      try {
        const response = await fetch(`${API_PREFIX}/puzzles/random?status=draft,published&exclude=${encodeURIComponent(puzzleId)}`);
        const data = await response.json();

        if (response.ok && data.success && data.puzzle?.id) {
          history.push(`/puzzles/${data.puzzle.id}`);
          return;
        }
      } catch {
        // Fall back to the preloaded neighbor below.
      }

      if (nextPuzzleId) {
        history.push(`/puzzles/${nextPuzzleId}`);
        return;
      }

      history.push("/puzzles");
    }

    void openRandomPuzzle();
  }, [history, nextPuzzleId, puzzleId]);

  const handleRatePuzzle = useCallback(async (rating: "like" | "dislike") => {
    if (!puzzle || hasRated) {
      return;
    }

    setHasRated(true);
    setRatingStatus("sending");
    try {
      const response = await fetch(`${API_PREFIX}/puzzles/${puzzle.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t("puzzles.rateError"));
      }

      setRatingStatus("sent");
    } catch {
      setRatingStatus("error");
    }
  }, [hasRated, puzzle, t]);

  const leaveControl = useMemo(() => ({
    content: <img src={CrossMarkRedPNG} alt={t("puzzles.controls.leave")} height={18} width={18} />,
    onClick: handleLeave,
    tooltip: t('puzzles.controls.leave'),
    withoutApprove: true,
  }), [handleLeave, t]);

  const hintControl = useMemo(() => ({
    content: <img src={AiIconPNG} alt={t("puzzles.controls.hint")} height={18} width={18} />,
    onClick: requestHint,
    tooltip: t('puzzles.controls.hint'),
    withoutApprove: true,
  }), [requestHint, t]);

  const nextControl = useMemo(() => ({
    content: <span className="text-xl leading-none text-white">›</span>,
    onClick: handleNextPuzzle,
    tooltip: t('puzzles.controls.next'),
    withoutApprove: true,
  }), [handleNextPuzzle]);

  const activeControls = useMemo(
    () => [hintControl, nextControl, leaveControl],
    [hintControl, leaveControl, nextControl],
  );

  const solvedControls = useMemo(
    () => [nextControl, leaveControl],
    [leaveControl, nextControl],
  );

  const handleSelectHistoryMove = useCallback((historyMoveData: { moveData: MoveData; isLastMove: boolean }) => {
    setIsHistoryMode(!historyMoveData.isLastMove);
    setSelectedHistoryMove(historyMoveData.moveData);
  }, []);

  if (status === "loading" || status === "idle") {
    return (
      <PuzzleShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#58C4A7] border-t-transparent" />
        </div>
      </PuzzleShell>
    );
  }

  if (status === "error" || !puzzle) {
    return (
      <PuzzleShell>
        <div className="mx-auto mt-16 max-w-xl rounded-lg border border-red-400/25 bg-red-500/10 p-6 text-center text-red-100">
          <p className="text-base font-medium">{error || t("puzzles.notFound")}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-5 h-10 rounded-md bg-white px-4 text-sm font-semibold text-[#10141f] transition hover:bg-white/90"
          >
            {t("puzzles.retry")}
          </button>
        </div>
      </PuzzleShell>
    );
  }

  return (
    <div className={`bg-back-primary grid h-screen items-center relative ${gridColsClass}`}>
      <div />

      <div className="relative">
        <ChessboardWrap
          reverse={reverseBoard}
          renderChessboard={(wrapWidth) => (
            <div className="relative">
              {isHistoryMode && (
                <div className="absolute left-0 top-0 z-10">
                  <ChessBoard
                    key="puzzleHistoryBoard"
                    FEN={selectedHistoryMove?.FEN || initialBoardFen}
                    onChange={() => undefined}
                    onEndGame={() => undefined}
                    reversed={reverseBoard}
                    viewOnly={true}
                    moveHighlight={selectedHistoryMoveHighlight}
                    config={{
                      squareSize: wrapWidth / 8,
                      ...chessboardConfig,
                    }}
                  />
                </div>
              )}

              <div style={{ opacity: isHistoryMode ? 0 : 1 }}>
                <ChessBoard
                  key={`puzzle-board-${boardResetVersion}`}
                  FEN={initialBoardFen}
                  onChange={(moveData) => submitMove(moveData as MoveData)}
                  onEndGame={() => undefined}
                  reversed={reverseBoard}
                  viewOnly={isLocked || isSolved}
                  change={externalChangeMove}
                  playerColor={playerColor}
                  moveArrows={mappedHintArrow}
                  config={{
                    squareSize: wrapWidth / 8,
                    ...chessboardConfig,
                  }}
                />
              </div>

              {message === "incorrect" && (
                <div className="absolute inset-x-4 top-4 z-50 rounded-md border border-red-300/30 bg-red-500/90 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
                  {t("puzzles.incorrectMove")}
                </div>
              )}

              {message === "solved" && (
                <div
                  className="absolute inset-x-4 top-4 z-50 rounded-md border border-[#9BE3CF]/40 bg-[#15866e]/95 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <div>{t("puzzles.solved")}</div>
                  {hasRated ? (
                    <div className="mt-3 flex flex-col items-center gap-3">
                      <div className="text-xs font-medium text-white/85">{t("puzzles.thankYou")}</div>
                      <button
                        type="button"
                        onClick={handleNextPuzzle}
                        className="h-9 rounded-md bg-white px-4 text-sm font-semibold text-[#15866e] transition hover:bg-white/90"
                      >
                        {t("puzzles.nextPuzzle")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 text-xs font-medium text-white/85">{t("puzzles.ratePrompt")}</div>
                      <div className="mt-2 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => void handleRatePuzzle("like")}
                          disabled={ratingStatus === "sending"}
                          className="flex h-9 w-12 items-center justify-center rounded-md bg-white/15 text-lg transition hover:bg-white/25 disabled:opacity-60"
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRatePuzzle("dislike")}
                          disabled={ratingStatus === "sending"}
                          className="flex h-9 w-12 items-center justify-center rounded-md bg-white/15 text-lg transition hover:bg-white/25 disabled:opacity-60"
                        >
                          👎
                        </button>
                      </div>
                    </>
                  )}
                  {ratingStatus === "error" && (
                    <div className="mt-2 text-xs font-medium text-red-100">{t("puzzles.saveRateError")}</div>
                  )}
                </div>
              )}
            </div>
          )}
        />

        <div className="absolute bottom-[-100px] left-0 right-0 flex justify-center">
          <GameScreenControls
            key={isSolved ? "solved" : "active"}
            isNotActive={isSolved}
            keepButtonsOpen={isSolved}
            controls={activeControls}
            highlightsControls={activeControls}
            notActiveControls={solvedControls}
            offeredDraw={false}
            onAcceptDraw={() => undefined}
            onDeclineDraw={() => undefined}
          />
        </div>
      </div>

      <div className="flex justify-start p-[28px]">
        <div className="fixed top-[40px] right-[40px] z-40 scale-on-small-height">
          <HistoryMoves moves={movesHistory} onSelectMove={handleSelectHistoryMove} />
        </div>
      </div>
    </div>
  );
}

function reverseCoords(coords: [number, number]): [number, number] {
  return [7 - coords[0], 7 - coords[1]];
}

function PuzzleShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-[#10141f] px-4 py-8 text-white">
      <div className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between gap-4">
        <Link to="/puzzles" className="text-sm font-medium text-white/65 transition hover:text-white">
          {t("puzzles.backToPuzzles")}
        </Link>
      </div>
      {children}
    </main>
  );
}
