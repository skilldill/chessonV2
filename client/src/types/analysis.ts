export type MoveQuality = "excellent" | "good" | "normal" | "bad" | "blunder";

export type AnalysisEvaluationPoint = {
  ply: number;
  moveNumber: number;
  score: number;
  quality?: MoveQuality;
};

export type AnalysisCounter = Record<"excellent" | "good" | "bad" | "blunder", number>;

export type AnalyzedMove = {
  ply: number;
  moveNumber: number;
  color: "white" | "black";
  notation: string;
  quality: MoveQuality;
  beforeScore: number;
  afterScore: number;
  lossCp: number;
  fenBefore: string;
  fenAfter: string;
};

export type GameAnalysisResult = {
  initialFEN: string;
  graph: AnalysisEvaluationPoint[];
  counters: {
    white: AnalysisCounter;
    black: AnalysisCounter;
  };
  moves: AnalyzedMove[];
  summary: {
    text: string;
    keyMomentPly?: number;
  };
};

export type GameAnalysisRecord = {
  gameId: string;
  status: "running" | "done" | "failed";
  progressCurrent: number;
  progressTotal: number;
  error?: string;
  result?: GameAnalysisResult;
};
