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

export interface RoomMoveData {
  FEN: string;
  from: [number, number];
  to: [number, number];
  type?: 'transform';
  figure: {
    color: 'white' | 'black';
    type: 'pawn' | 'bishop' | 'knight' | 'rook' | 'queen' | 'king';
    touched?: boolean;
  };
}

export interface BotRoomMoveRequest {
  fen: string;
  difficulty?: BotDifficulty;
  moveTimeMs: number;
}

export interface BotRoomMoveResult extends BotMoveResult {
  moveData: RoomMoveData;
}

export interface StockfishEngineOptions {
  stockfishPath: string;
  startupTimeoutMs?: number;
  requestTimeoutBufferMs?: number;
  restartDelayMs?: number;
}
