import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";
import type { PuzzleListItem } from "../../types/puzzle";

export function PuzzleListScreen() {
  const [puzzles, setPuzzles] = useState<PuzzleListItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadPuzzles() {
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch(`${API_PREFIX}/puzzles?status=draft,published&limit=100`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Не удалось загрузить задачи");
        }

        if (!ignore) {
          setPuzzles(data.puzzles as PuzzleListItem[]);
          setStatus("ready");
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить задачи");
          setStatus("error");
        }
      }
    }

    void loadPuzzles();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#10141f] px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Шахматные задачи</h1>
            <p className="mt-2 text-sm text-white/60">Тактические позиции из сыгранных партий</p>
          </div>
          <Link
            to="/main"
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/12 px-4 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/8"
          >
            На главную
          </Link>
        </header>

        {status === "loading" && (
          <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#58C4A7] border-t-transparent" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-red-400/25 bg-red-500/10 p-5 text-sm text-red-100">
            {error}
          </div>
        )}

        {status === "ready" && puzzles.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-white/60">
            Пока нет созданных задач.
          </div>
        )}

        {status === "ready" && puzzles.length > 0 && (
          <div className="grid gap-3">
            {puzzles.map((puzzle, index) => (
              <Link
                key={puzzle.id}
                to={`/puzzles/${puzzle.id}`}
                className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#58C4A7]/50 hover:bg-white/[0.07] sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold">Задача #{index + 1}</span>
                    <span className="rounded bg-white/10 px-2 py-1 text-xs text-white/70">{difficultyLabel[puzzle.difficulty]}</span>
                    <span className="rounded bg-[#58C4A7]/15 px-2 py-1 text-xs text-[#9BE3CF]">{puzzle.sideToMove === "white" ? "Ход белых" : "Ход черных"}</span>
                    {puzzle.status === "draft" && (
                      <span className="rounded bg-amber-400/15 px-2 py-1 text-xs text-amber-100">draft</span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-white/55">
                    {Math.ceil(puzzle.solutionLength / 2)} ход(а) игрока · партия {puzzle.sourceGameId} · ply {puzzle.sourcePly}
                  </div>
                </div>
                <span className="text-sm font-medium text-[#9BE3CF]">Открыть</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const difficultyLabel: Record<PuzzleListItem["difficulty"], string> = {
  easy: "Легкая",
  medium: "Средняя",
  hard: "Сложная",
};
