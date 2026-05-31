import type { ChessColor, MoveData } from "./index";

export type PuzzleStatus = "draft" | "published" | "rejected";
export type PuzzleDifficulty = "easy" | "medium" | "hard";

export interface PuzzleListItem {
  id: string;
  sourceGameId: string;
  sourcePly: number;
  initialFEN: string;
  sideToMove: ChessColor;
  solutionLength: number;
  difficulty: PuzzleDifficulty;
  themes: string[];
  status: PuzzleStatus;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
}

export interface Puzzle extends Omit<PuzzleListItem, "solutionLength"> {
  solution: MoveData[];
}
