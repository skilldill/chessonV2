export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotMoveRequest {
  fen?: string;
  moves?: string[];
  difficulty?: BotDifficulty;
  moveTimeMs: number;
}

export interface BotMoveResult {
  bestMove: string;
  ponder?: string;
  depth?: number;
  scoreCp?: number;
}

export interface StockfishEngineOptions {
  stockfishPath: string;
  startupTimeoutMs?: number;
  requestTimeoutBufferMs?: number;
  restartDelayMs?: number;
}
