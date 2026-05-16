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

export type AnalysisGraphPoint = {
  ply: number;
  moveNumber: number;
  score: number;
  quality?: MoveQuality;
};

export type AnalysisCounter = Record<'excellent' | 'good' | 'bad' | 'blunder', number>;

export type AnalyzedMove = {
  ply: number;
  moveNumber: number;
  color: FigureColor;
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
  graph: AnalysisGraphPoint[];
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
