export type MoveQuality = "excellent" | "good" | "normal" | "bad" | "blunder";

export type AnalysisEvaluationPoint = {
  ply: number;
  moveNumber: number;
  score: number;
  quality?: MoveQuality;
};

export type AnalysisCounter = Record<"excellent" | "good" | "bad" | "blunder", number>;

export type AnalysisSideSummary = AnalysisCounter & {
  accuracy: number;
  averageLossCp: number;
  accuracyLabel: string;
};

export type AnalysisBestMove = {
  uci: string;
  notation: string;
  from: [number, number];
  to: [number, number];
};

export type AnalyzedMove = {
  ply: number;
  moveNumber: number;
  color: "white" | "black";
  from: [number, number];
  to: [number, number];
  notation: string;
  quality: MoveQuality;
  qualityDescription: string;
  beforeScore: number;
  afterScore: number;
  lossCp: number;
  fenBefore: string;
  fenAfter: string;
  bestMove?: AnalysisBestMove;
  nextBestMove?: AnalysisBestMove;
};

export type GameAnalysisResult = {
  initialFEN: string;
  graph: AnalysisEvaluationPoint[];
  counters: {
    white: AnalysisSideSummary;
    black: AnalysisSideSummary;
  };
  moves: AnalyzedMove[];
  summary: {
    text: string;
    keyMomentPly?: number;
    bestMovePly?: number;
    bestMoveText?: string;
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
