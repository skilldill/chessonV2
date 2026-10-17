import type { MoveData as BoardMove } from 'react-chessboard-ui'

export type Color = 'white' | 'black'
export type GameMode = 'friend' | 'bot'
export type Difficulty = 'super_easy' | 'easy' | 'medium' | 'hard'
export type MoveData = BoardMove & { FEN: string }
export type GameResult = { resultType: 'mat' | 'pat' | 'draw' | 'resignation'; winColor?: Color }
export type Player = { userId: string; userName: string; avatar: string; color: Color }
export type Timer = { whiteTime: number; blackTime: number; initialWhiteTime: number; initialBlackTime: number; whiteIncrement?: number; blackIncrement?: number }
export type GameState = {
  currentFEN: string
  currentPlayer: Color
  currentColor: Color
  moveHistory: MoveData[]
  gameStarted: boolean
  gameEnded: boolean
  manualBotRoom?: boolean
  gameResult?: GameResult
  player?: Player
  opponent?: Player
  isSpectator?: boolean
  timer?: Timer
  drawOffer?: { from: string; to: string; status: 'pending' | 'accepted' | 'declined' }
  drawOfferCount?: Record<string, number>
}
export type ServerMessage = {
  type?: string
  system?: boolean
  message?: string
  userColor?: Color
  gameState?: GameState
  moveData?: MoveData
  timer?: Timer
  gameResult?: GameResult
}
export type ClientMessage =
  | { type: 'move'; moveData: MoveData }
  | { type: 'resign' }
  | { type: 'drawOffer'; action: 'offer' | 'accept' | 'decline' }
  | { type: 'gameResult'; gameResult: GameResult }
export type Settings = { mode: GameMode; timeMinutes: number; incrementSeconds: number; difficulty: Difficulty; color: Color | 'random' }
export type ConnectionStatus = 'loading' | 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'expired' | 'error'
