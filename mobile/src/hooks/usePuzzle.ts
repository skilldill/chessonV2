import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { JSChessEngine } from "react-chessboard-ui";
import { API_PREFIX } from "../constants/api";
import type { ChessColor, MoveData } from "../types";
import type { Puzzle } from "../types/puzzle";
import { isPuzzlePlayable } from "../utils/puzzleValidation";

type PuzzleStatus = "idle" | "loading" | "ready" | "error";
type PuzzleMessage = "incorrect" | "solved" | null;

const WRONG_MOVE_RESET_MS = 1500;
const SYSTEM_MOVE_DELAY_MS = 1000;

export function usePuzzle(puzzleId: string, options: { onInvalidPuzzle?: (puzzleId: string) => void } = {}) {
  const { onInvalidPuzzle } = options;
  const { t } = useTranslation();
  const [status, setStatus] = useState<PuzzleStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [boardFen, setBoardFen] = useState("");
  const [stableFen, setStableFen] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [movesHistory, setMovesHistory] = useState<MoveData[]>([]);
  const [externalChangeMove, setExternalChangeMove] = useState<{ move: MoveData; withTransition: boolean } | undefined>();
  const [hintArrow, setHintArrow] = useState<{ from: [number, number]; to: [number, number] } | null>(null);
  const [boardResetVersion, setBoardResetVersion] = useState(0);
  const [message, setMessage] = useState<PuzzleMessage>(null);
  const [isLocked, setIsLocked] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);
  const systemMoveTimeoutRef = useRef<number | null>(null);

  const playerColor: ChessColor = puzzle?.sideToMove ?? "white";
  const isSolved = puzzle ? currentIndex >= puzzle.solution.length : false;
  const expectedMove = useMemo(
    () => puzzle?.solution[currentIndex] ?? null,
    [puzzle, currentIndex],
  );

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  const clearSystemMoveTimeout = useCallback(() => {
    if (systemMoveTimeoutRef.current !== null) {
      window.clearTimeout(systemMoveTimeoutRef.current);
      systemMoveTimeoutRef.current = null;
    }
  }, []);

  const loadPuzzle = useCallback(async () => {
    if (!puzzleId) return;

    clearResetTimeout();
    clearSystemMoveTimeout();
    setStatus("loading");
    setError(null);
    setMessage(null);
    setIsLocked(false);
    setExternalChangeMove(undefined);
    setHintArrow(null);

    try {
      const response = await fetch(`${API_PREFIX}/puzzles/${puzzleId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t("puzzles.loadError"));
      }

      const loadedPuzzle = data.puzzle as Puzzle;
      if (!isPuzzlePlayable(loadedPuzzle)) {
        onInvalidPuzzle?.(loadedPuzzle.id);
        return;
      }

      setPuzzle(loadedPuzzle);
      setBoardFen(loadedPuzzle.initialFEN);
      setStableFen(loadedPuzzle.initialFEN);
      setCurrentIndex(0);
      setMovesHistory([]);
      setBoardResetVersion((value) => value + 1);
      setStatus("ready");
    } catch (loadError) {
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : t("puzzles.loadError"));
    }
  }, [clearResetTimeout, clearSystemMoveTimeout, onInvalidPuzzle, puzzleId, t]);

  useEffect(() => {
    void loadPuzzle();
    return () => {
      clearResetTimeout();
      clearSystemMoveTimeout();
    };
  }, [clearResetTimeout, clearSystemMoveTimeout, loadPuzzle]);

  const submitMove = useCallback((rawMoveData: MoveData) => {
    if (!puzzle || isLocked || isSolved) {
      return;
    }

    setHintArrow(null);

    const moveData = playerColor === "black"
      ? JSChessEngine.reverseMove(rawMoveData) as MoveData
      : rawMoveData;
    const expected = puzzle.solution[currentIndex];

    if (!expected || !isSameMove(moveData, expected)) {
      setIsLocked(true);
      setMessage("incorrect");
      clearResetTimeout();

      resetTimeoutRef.current = window.setTimeout(() => {
        setBoardFen(stableFen);
        setExternalChangeMove(undefined);
        setBoardResetVersion((value) => value + 1);
        setMessage(null);
        setIsLocked(false);
        setHintArrow(null);
      }, WRONG_MOVE_RESET_MS);
      return;
    }

    const nextHistory = [...movesHistory, expected];
    const nextIndexAfterUser = currentIndex + 1;
    const systemMove = puzzle.solution[nextIndexAfterUser];
    const hasNextUserMove = Boolean(puzzle.solution[nextIndexAfterUser + 1]);

    if (!systemMove || !hasNextUserMove) {
      setMovesHistory(nextHistory);
      setStableFen(expected.FEN);
      setCurrentIndex(puzzle.solution.length);
      setMessage("solved");
      setIsLocked(true);
      return;
    }

    setMovesHistory(nextHistory);
    setStableFen(expected.FEN);
    setCurrentIndex(nextIndexAfterUser);
    setExternalChangeMove(undefined);
    setIsLocked(true);
    setMessage(null);

    clearSystemMoveTimeout();
    systemMoveTimeoutRef.current = window.setTimeout(() => {
      setMovesHistory((history) => [...history, systemMove]);
      setStableFen(systemMove.FEN);
      setCurrentIndex(nextIndexAfterUser + 1);
      setExternalChangeMove({
        move: systemMove,
        withTransition: true,
      });
      setIsLocked(false);
      systemMoveTimeoutRef.current = null;
    }, SYSTEM_MOVE_DELAY_MS);
  }, [
    clearResetTimeout,
    clearSystemMoveTimeout,
    currentIndex,
    isLocked,
    isSolved,
    movesHistory,
    playerColor,
    puzzle,
    stableFen,
  ]);

  const requestHint = useCallback(() => {
    if (!expectedMove || isLocked || isSolved) {
      return;
    }

    setHintArrow({
      from: expectedMove.from,
      to: expectedMove.to,
    });
  }, [expectedMove, isLocked, isSolved]);

  return {
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
    reload: loadPuzzle,
  };
}

function isSameMove(a: MoveData, b: MoveData): boolean {
  return a.from[0] === b.from[0]
    && a.from[1] === b.from[1]
    && a.to[0] === b.to[0]
    && a.to[1] === b.to[1]
    && a.figure.color === b.figure.color
    && a.figure.type === b.figure.type;
}
