import { Link, useParams } from "react-router-dom";
import { ChessBoard } from "react-chessboard-ui";
import type { ReactNode } from "react";
import { ChessboardWrap } from "../../components/ChessboardWrap/ChessboardWrap";
import { getChessboardConfig } from "../../components/ChessBoardConfigs/ChessBoardConfigs";
import { useAppearance } from "../../hooks/useAppearance";
import { usePuzzle } from "../../hooks/usePuzzle";
import type { MoveData } from "../../types";

export function PuzzleScreen() {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const { chessboardTheme } = useAppearance();
  const chessboardConfig = getChessboardConfig(chessboardTheme);
  const {
    status,
    error,
    puzzle,
    boardFen,
    playerColor,
    movesHistory,
    externalChangeMove,
    boardResetVersion,
    message,
    isLocked,
    isSolved,
    submitMove,
    resetPuzzle,
    reload,
  } = usePuzzle(puzzleId);

  const reverseBoard = playerColor === "black";
  const initialBoardFen = boardFen || puzzle?.initialFEN || "";

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
    <PuzzleShell>
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(320px,640px)_minmax(280px,1fr)]">
        <section className="min-w-0">
          <ChessboardWrap
            reverse={reverseBoard}
            renderChessboard={(wrapWidth) => (
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
                  config={{
                    squareSize: wrapWidth / 8,
                    ...chessboardConfig,
                  }}
                />

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
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#58C4A7]/15 px-2 py-1 text-xs font-medium text-[#9BE3CF]">
                {playerColor === "white" ? "Ход белых" : "Ход черных"}
              </span>
              <span className="rounded bg-white/10 px-2 py-1 text-xs font-medium text-white/70">
                {difficultyLabel[puzzle.difficulty]}
              </span>
              {puzzle.status === "draft" && (
                <span className="rounded bg-amber-400/15 px-2 py-1 text-xs font-medium text-amber-100">draft</span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-normal">Решите задачу</h1>
            <p className="mt-2 text-sm text-white/60">
              Сделайте лучший ход. Ответ соперника будет выполнен автоматически.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-black/20 p-3">
                <div className="text-white/45">Ходы игрока</div>
                <div className="mt-1 font-semibold">{Math.ceil(puzzle.solution.length / 2)}</div>
              </div>
              <div className="rounded-md bg-black/20 p-3">
                <div className="text-white/45">Сделано</div>
                <div className="mt-1 font-semibold">{Math.ceil(movesHistory.length / 2)}</div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetPuzzle}
                className="h-10 rounded-md border border-white/12 px-4 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/8"
              >
                Сначала
              </button>
              <Link
                to="/puzzles"
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/12 px-4 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/8"
              >
                К списку
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-white/45">Прогресс</h2>
            <div className="mt-4 flex flex-col gap-2">
              {puzzle.solution.map((move, index) => {
                const isDone = index < movesHistory.length;
                const isPlayerMove = index % 2 === 0;

                return (
                  <div
                    key={`${move.from.join("-")}-${move.to.join("-")}-${index}`}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                      isDone ? "bg-[#58C4A7]/12 text-[#BFF0E3]" : "bg-black/20 text-white/45"
                    }`}
                  >
                    <span>{isPlayerMove ? "Ваш ход" : "Ответ"}</span>
                    <span>{isDone ? "готово" : isSolved ? "готово" : "ожидание"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </PuzzleShell>
  );
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

const difficultyLabel = {
  easy: "Легкая",
  medium: "Средняя",
  hard: "Сложная",
};
