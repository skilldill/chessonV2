import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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

export function PuzzleScreen() {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const history = useHistory();
  const { chessboardTheme } = useAppearance();
  const gridColsClass = useScreenHeightForChessboard();
  const chessboardConfig = getChessboardConfig(chessboardTheme);
  const [nextPuzzleId, setNextPuzzleId] = useState<string | null>(null);
  const [isHistoryMode, setIsHistoryMode] = useState(false);
  const [selectedHistoryMove, setSelectedHistoryMove] = useState<MoveData>();
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
  }, [puzzleId]);

  const handleLeave = useCallback(() => {
    history.push("/puzzles");
  }, [history]);

  const handleNextPuzzle = useCallback(() => {
    if (nextPuzzleId) {
      history.push(`/puzzles/${nextPuzzleId}`);
      return;
    }

    history.push("/puzzles");
  }, [history, nextPuzzleId]);

  const leaveControl = useMemo(() => ({
    content: <img src={CrossMarkRedPNG} alt="Уйти" height={18} width={18} />,
    onClick: handleLeave,
    tooltip: "Уйти",
    withoutApprove: true,
  }), [handleLeave]);

  const hintControl = useMemo(() => ({
    content: <img src={AiIconPNG} alt="Подсказка" height={18} width={18} />,
    onClick: requestHint,
    tooltip: "Подсказка",
    withoutApprove: true,
  }), [requestHint]);

  const nextControl = useMemo(() => ({
    content: <span className="text-xl leading-none text-white">›</span>,
    onClick: handleNextPuzzle,
    tooltip: "Следующая",
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
          <p className="text-base font-medium">{error || "Задача не найдена"}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-5 h-10 rounded-md bg-white px-4 text-sm font-semibold text-[#10141f] transition hover:bg-white/90"
          >
            Повторить
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
                <div className="absolute inset-x-4 top-4 rounded-md border border-red-300/30 bg-red-500/90 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
                  Неверный ход
                </div>
              )}

              {message === "solved" && (
                <div className="absolute inset-x-4 top-4 rounded-md border border-[#9BE3CF]/40 bg-[#15866e]/95 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
                  Задача решена
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
  return (
    <main className="min-h-screen bg-[#10141f] px-4 py-8 text-white">
      <div className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between gap-4">
        <Link to="/puzzles" className="text-sm font-medium text-white/65 transition hover:text-white">
          Назад к задачам
        </Link>
      </div>
      {children}
    </main>
  );
}
