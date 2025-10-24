// Типы для шахматных фигур
export type ChessColor = "white" | "black";
export type ChessPieceType = "pawn" | "bishop" | "knight" | "rook" | "queen" | "king";

// Типы для ходов
export interface MoveData {
  FEN: string;
  from: [number, number];
  to: [number, number];
  figure: {
    color: ChessColor;
    type: ChessPieceType;
  };
}

// Типы для позиции курсора
export interface CursorPosition {
  x: number;
  y: number;
}

// Типы для результата игры
export type GameResultType = "mat" | "pat" | "draw" | "resignation";

export interface GameResult {
  resultType: GameResultType;
  winColor?: ChessColor;
}

// Типы для предложения ничьей
export interface DrawOffer {
  from: string;
  to: string;
  status: "pending" | "accepted" | "declined";
}

// Типы для таймера
export interface TimerState {
  whiteTime: number; // время в секундах
  blackTime: number; // время в секундах
  whiteIncrement?: number; // добавка времени за ход в секундах
  blackIncrement?: number; // добавка времени за ход в секундах
}

// Типы для состояния игры
export interface GameState {
  currentFEN: string;
  moveHistory: MoveData[];
  currentPlayer: ChessColor;
  gameStarted: boolean;
  gameEnded: boolean;
  gameResult?: GameResult;
  drawOffer?: DrawOffer;
  drawOfferCount: { [userId: string]: number };
  timer?: TimerState;
}

// Типы для WebSocket сообщений от клиента
export type WSClientMessage = 
  | { type: "message"; message: string }
  | { type: "move"; moveData: MoveData }
  | { type: "cursor"; position: CursorPosition }
  | { type: "gameResult"; gameResult: GameResult }
  | { type: "drawOffer"; action: "offer" | "accept" | "decline" }
  | { type: "resign" };

// Типы для WebSocket сообщений от сервера
export interface WSServerMessage {
  system?: boolean;
  message?: string;
  type?: "connection" | "reconnection" | "gameStart" | "gameEnd" | "message" | "move" | "cursor" | "gameResult" | "drawOffer" | "timerTick";
  userColor?: ChessColor;
  opponentColor?: ChessColor;
  gameState?: GameState;
  moveData?: MoveData;
  position?: CursorPosition;
  gameResult?: GameResult;
  action?: "offer" | "accept" | "decline";
  from?: string;
  userId?: string;
  time?: number;
  timer?: TimerState;
  currentPlayer?: ChessColor;
}

// Типы для состояния комнаты
export interface RoomState {
  roomId: string;
  userName: string;
  userColor?: ChessColor;
  gameState: GameState;
  isConnected: boolean;
  isGameStarted: boolean;
  isGameEnded: boolean;
  opponentName?: string;
  opponentColor?: ChessColor;
}

// Типы для API ответов
export interface CreateRoomResponse {
  success: boolean;
  roomId: string;
  message: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

export interface ChatMessage {
  from: string;
  message: string;
  userId: string;
  time: number;
};
