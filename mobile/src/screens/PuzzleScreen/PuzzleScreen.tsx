import { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChessBoard } from "react-chessboard-ui";
import { API_PREFIX } from "../../constants/api";
import { CHESSBOARD_THEMES } from "../../components/ChessBoardConfigs/ChessBoardConfigs";
import { GameScreenControls } from "../../components/GameScreenControls/GameScreenControls";
import { HistoryMoves } from "../../components/HistoryMoves/HistoryMoves";
import { useAppearance } from "../../hooks/useAppearance";
import { useCellSize } from "../../hooks/useCellSize";
import { usePuzzle } from "../../hooks/usePuzzle";
import type { MoveData } from "../../types";
import type { PuzzleListItem } from "../../types/puzzle";

import AiIconPNG from "../../assets/ai-icon.png";
import CrossMarkRedPNG from "../../assets/cross-mark.png";

export function PuzzleScreen() {
  const { t } = useTranslation();
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const history = useHistory();
  const cellSize = useCellSize();
  const { chessboardTheme } = useAppearance();
  const themeConfig = CHESSBOARD_THEMES[chessboardTheme];
  const [nextPuzzleId, setNextPuzzleId] = useState<string | null>(null);
  const [ratingStatus, setRatingStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [hasRated, setHasRated] = useState(false);
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
  } = usePuzzle(puzzleId);

  const reverseBoard = playerColor === "black";
  const initialBoardFen = boardFen || puzzle?.initialFEN || "";
  const mappedHintArrow = useMemo(() => {
    if (!hintArrow) {
      return [];
    }

    if (playerColor !== "black") {
      return [{ start: hintArrow.from, end: hintArrow.to }];
    }

    return [{ start: reverseCoords(hintArrow.from), end: reverseCoords(hintArrow.to) }];
  }, [hintArrow, playerColor]);

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
    setRatingStatus("idle");
    setHasRated(false);
  }, [puzzleId]);

  const handleLeave = useCallback(() => {
    history.push("/main");
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
        // fallback below
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

  const hintControl = useMemo(() => ({
    content: <img src={AiIconPNG} alt={t("puzzles.controls.hint")} height={18} width={18} />,
    onClick: requestHint,
    tooltip: t("puzzles.controls.hint"),
    withoutApprove: true,
  }), [requestHint, t]);

  const nextControl = useMemo(() => ({
    content: <span className="text-xl leading-none text-white">›</span>,
    onClick: handleNextPuzzle,
    tooltip: t("puzzles.controls.next"),
    withoutApprove: true,
  }), [handleNextPuzzle, t]);

  const leaveControl = useMemo(() => ({
    content: <img src={CrossMarkRedPNG} alt={t("puzzles.controls.leave")} height={18} width={18} />,
    onClick: handleLeave,
    tooltip: t("puzzles.controls.leave"),
    withoutApprove: true,
  }), [handleLeave, t]);

  const activeControls = useMemo(
    () => [hintControl, nextControl, leaveControl],
    [hintControl, leaveControl, nextControl],
  );
  const solvedControls = useMemo(
    () => [nextControl, leaveControl],
    [leaveControl, nextControl],
  );

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex h-screen items-center justify-center bg-back-primary text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#58C4A7] border-t-transparent" />
      </div>
    );
  }

  if (status === "error" || !puzzle) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-back-primary p-4 text-center text-white">
        <div className="rounded-lg border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
          {error || t("puzzles.notFound")}
        </div>
        <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black" onClick={() => void reload()}>
          {t("puzzles.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[1fr_56px] h-full bg-back-primary" style={{ height: window.innerHeight }}>
      <div className="flex flex-col h-full justify-center">
        <HistoryMoves moves={movesHistory} />
        <div className="relative">
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
              squareSize: cellSize,
              ...themeConfig,
            }}
          />

          {message === "incorrect" && (
            <div className="absolute inset-x-4 top-4 z-50 rounded-md border border-red-300/30 bg-red-500/90 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
              {t("puzzles.incorrectMove")}
            </div>
          )}

          {message === "solved" && (
            <div
              className="fixed inset-x-4 top-4 z-50 rounded-md border border-[#9BE3CF]/40 bg-[#15866e]/95 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="text-2xl">{t("puzzles.solved")}</div>

              {hasRated ? (
                <div className="mt-3 flex flex-col items-center gap-3">
                  <div className="text-2xl text-white/85">{t("puzzles.thankYou")}</div>
                  <button
                    type="button"
                    onClick={handleNextPuzzle}
                    className="w-full py-[10px] rounded-md bg-white px-4 text-xl font-semibold text-[#15866e]"
                  >
                    {t("puzzles.nextPuzzle")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-3 text-xl text-white/85">{t("puzzles.ratePrompt")}</div>
                  <div className="mt-5 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handleRatePuzzle("like")}
                      disabled={ratingStatus === "sending"}
                      className="flex flex-1 h-14 w-16 items-center justify-center rounded-xl bg-white/15 text-3xl active:scale-95 disabled:opacity-60"
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRatePuzzle("dislike")}
                      disabled={ratingStatus === "sending"}
                      className="flex flex-1 h-14 w-16 items-center justify-center rounded-xl bg-white/15 text-3xl active:scale-95 disabled:opacity-60"
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
      </div>

      <div className="p-[12px] flex justify-center">
        <GameScreenControls
          key={isSolved ? "solved" : "active"}
          isNotActive={isSolved}
          keepButtonsOpen={isSolved}
          controls={activeControls}
          notActiveControls={solvedControls}
          highlightsControls={activeControls}
          offeredDraw={false}
          onAcceptDraw={() => undefined}
          onDeclineDraw={() => undefined}
        />
      </div>
    </div>
  );
}

function reverseCoords(coords: [number, number]): [number, number] {
  return [7 - coords[0], 7 - coords[1]];
}

export default PuzzleScreen;
