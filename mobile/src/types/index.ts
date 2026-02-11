import type { JSX } from "react";
import { Piece } from "react-chessboard-ui";

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
  initialWhiteTime: number; // добавка времени за ход в секундах
  initialBlackTime: number; // добавка времени за ход в секундах
}

// Типы для информации об игроке
export interface PlayerInfo {
  userId: string;
  userName: string;
  avatar: string;
  color: ChessColor;
}

// Типы для состояния игры
export interface GameState {
  currentFEN: string;
  moveHistory: MoveData[];
  currentPlayer: ChessColor;
  currentColor: ChessColor; // чей ход
  gameStarted: boolean;
  gameEnded: boolean;
  gameResult?: GameResult;
  drawOffer?: DrawOffer;
  drawOfferCount: { [userId: string]: number };
  timer?: TimerState;
  player?: PlayerInfo;
  opponent?: PlayerInfo;
}

export type ScreenSize = {
  width: number;
  height: number;
}


// Типы для WebSocket сообщений от клиента
export type WSClientMessage = 
  | { type: "message"; message: string }
  | { type: "move"; moveData: MoveData }
  | { type: "cursor"; position: CursorPosition, screenSize: ScreenSize }
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
  screenSize?: ScreenSize;
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

type ChessBoardConfig = {
  squareSize: number;
  pieceSizePercent: number;
  lightSquareClassName: string;
  darkSquareClassName: string;
  pickedSquareClassName: string;
  checkedSquareClassName: string;
  hidePieceEffectClassName: string;
  squareHighlightClassName: string;
  selectedSquareClassName: string;
  holdedPieceClassName: string;
  possibleMoveMarkClassName: string;
  factorForSizeCircleMark: number;

  circleMarkColor: string;
  arrowColor: string;
  piecesMap: ChessPiecesMap;
  showMovesTrail: boolean;
  onHidePieces: (piece: Piece) => void;
}

export type ChessboardConfig = Partial<ChessBoardConfig>;

export type ChessPiecesMap = {
  [key: string]: (size: number) => JSX.Element;
}