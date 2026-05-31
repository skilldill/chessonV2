import { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_PREFIX } from "../../constants/api";

export function PuzzleListScreen() {
  const { t } = useTranslation();
  const history = useHistory();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function pickPuzzle() {
      setError(null);

      try {
        const response = await fetch(`${API_PREFIX}/puzzles/random?status=draft,published`);
        const data = await response.json();

        if (!response.ok || !data.success || !data.puzzle?.id) {
          throw new Error(data.error || t("puzzles.pickError"));
        }

        if (!ignore) {
          history.replace(`/puzzles/${data.puzzle.id}`);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : t("puzzles.pickError"));
        }
      }
    }

    void pickPuzzle();

    return () => {
      ignore = true;
    };
  }, [history, t]);

  return (
    <main className="min-h-screen bg-[#10141f] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#58C4A7] border-t-transparent" />
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{t("puzzles.pickingTitle")}</h1>
          <p className="mt-2 text-sm text-white/60">{t("puzzles.pickingSubtitle")}</p>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {error && (
          <Link
            to="/main"
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/12 px-4 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/8"
          >
            {t("puzzles.goHome")}
          </Link>
        )}
      </div>
    </main>
  );
}
