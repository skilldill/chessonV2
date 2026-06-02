const RECENT_PUZZLE_IDS_KEY = "chesson.recentPuzzleIds";
const MAX_RECENT_PUZZLE_IDS = 30;

export function getRecentPuzzleIds(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_PUZZLE_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
  } catch {
    return [];
  }
}

export function rememberRecentPuzzleId(puzzleId: string): void {
  if (!puzzleId) {
    return;
  }

  const nextIds = getRecentPuzzleIds().filter((id) => id !== puzzleId);
  nextIds.push(puzzleId);

  try {
    window.localStorage.setItem(RECENT_PUZZLE_IDS_KEY, JSON.stringify(nextIds.slice(-MAX_RECENT_PUZZLE_IDS)));
  } catch {
    // Ignore localStorage quota/privacy errors.
  }
}

export function getPuzzleExcludeParam(extraIds: string[] = []): string {
  const ids = [...getRecentPuzzleIds(), ...extraIds].filter(Boolean);
  return encodeURIComponent([...new Set(ids)].join(","));
}
