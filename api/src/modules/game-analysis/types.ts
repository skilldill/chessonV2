export type FigureColor = 'white' | 'black';
export type FigureType = 'pawn' | 'bishop' | 'knight' | 'rook' | 'queen' | 'king';
export type MoveQuality = 'excellent' | 'good' | 'normal' | 'bad' | 'blunder';

export type AnalysisMoveData = {
  FEN: string;
  from: [number, number];
  to: [number, number];
  figure: {
    color: FigureColor;
    type: FigureType;
  };
};

export type EngineEvaluation = {
  scoreCp: number;
  mateIn?: number;
  bestMove?: string;
  depth?: number;
};

export type AnalysisBestMove = {
  uci: string;
  notation: string;
  from: [number, number];
  to: [number, number];
};

export type AnalysisGraphPoint = {
  ply: number;
  moveNumber: number;
  score: number;
  quality?: MoveQuality;
};

export type AnalysisCounter = Record<'excellent' | 'good' | 'bad' | 'blunder', number>;

export type AnalysisSideSummary = AnalysisCounter & {
  accuracy: number;
  averageLossCp: number;
  accuracyLabel: string;
};

export type AnalyzedMove = {
  ply: number;
  moveNumber: number;
  color: FigureColor;
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
  graph: AnalysisGraphPoint[];
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
