import { Chess, type Square, type PieceSymbol } from 'chess.js'
import type { MoveData as BoardMove } from 'react-chessboard-ui'
import type { Color, GameResult, GameState, MoveData, Settings } from '../types/game'

export const MINUTES = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 120]
export const INCREMENTS = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 60, 100]
export const DIFFICULTIES = { super_easy: 'Для начинающих', easy: 'Лёгкая', medium: 'Средняя', hard: 'Сложная' } as const
export const isRoomId = (value: string) => /^[a-zA-Z0-9_-]{1,128}$/.test(value)

// Пока что не показываем время, поэтому 240 минут каждому игроку на подумать
export const defaultSettings = (mode: Settings['mode']): Settings => ({ mode, timeMinutes: mode === 'bot' ? 240 : 240, incrementSeconds: 0, difficulty: 'medium', color: mode === 'bot' ? 'white' : 'random' })

export function parseEntry(search: string): (Settings & { requestId: string }) | null {
  const p = new URLSearchParams(search)
  const mode = p.get('mode')
  if ((mode !== 'friend' && mode !== 'bot') || p.get('autoStart') !== '1') return null
  const keys = ['mode', 'autoStart', 'timeMinutes', 'incrementSeconds', 'botDifficulty', 'color', 'gameMode', 'requestId', 'withAIhints']
  if (keys.some(key => p.getAll(key).length > 1)) return null
  const minutes = p.get('timeMinutes'), increment = p.get('incrementSeconds')
  const difficulty = p.get('botDifficulty') ?? 'medium', color = p.get('color') ?? (mode === 'bot' ? 'white' : 'random')
  const requestId = p.get('requestId') ?? crypto.randomUUID()
  if (!minutes || !/^\d+$/.test(minutes) || !MINUTES.includes(Number(minutes)) || increment === null || !/^\d+$/.test(increment) || !INCREMENTS.includes(Number(increment))
    || !Object.hasOwn(DIFFICULTIES, difficulty) || !['white', 'black', 'random'].includes(color)
    || (p.has('gameMode') && p.get('gameMode') !== 'standard') || !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId)
    || (p.has('withAIhints') && !['true', 'false'].includes(p.get('withAIhints')!))) return null
  return { ...defaultSettings(mode), timeMinutes: Number(minutes), incrementSeconds: Number(increment), difficulty: difficulty as Settings['difficulty'], color: color as Settings['color'], requestId }
}

export function roomPayload(settings: Settings, requestId: string) {
  return { requestId, whiteTimer: settings.timeMinutes * 60, blackTimer: settings.timeMinutes * 60, increment: settings.incrementSeconds,
    vsBot: settings.mode === 'bot', withAIhints: false, gameMode: 'standard',
    ...(settings.color !== 'random' ? { color: settings.color } : {}),
    ...(settings.mode === 'bot' ? { botDifficulty: settings.difficulty, botMoveTimeMs: 800 } : {}) }
}

const square = ([x, y]: number[]): Square => `${'abcdefgh'[x]}${8 - y}` as Square
const promotions: Record<string, PieceSymbol> = { queen: 'q', rook: 'r', bishop: 'b', knight: 'n' }

export function normalizeMove(fen: string, move: BoardMove, reversed: boolean): MoveData {
  const from: [number, number] = reversed ? [7 - move.from[0], 7 - move.from[1]] : [...move.from]
  const to: [number, number] = reversed ? [7 - move.to[0], 7 - move.to[1]] : [...move.to]
  const chess = new Chess(fen)
  const played = chess.move({ from: square(from), to: square(to), promotion: move.type === 'transform' ? promotions[move.figure.type] : undefined })
  if (!played) throw new Error('Недопустимый ход')
  return { from, to, figure: { color: played.color === 'w' ? 'white' : 'black', type: move.figure.type }, FEN: chess.fen(), ...(played.promotion ? { type: 'transform' as const } : {}) }
}

export function positionResult(fen: string): GameResult | undefined {
  const chess = new Chess(fen)
  if (chess.isCheckmate()) return { resultType: 'mat', winColor: chess.turn() === 'w' ? 'black' : 'white' }
  if (chess.isStalemate()) return { resultType: 'pat' }
  if (chess.isInsufficientMaterial() || chess.isDrawByFiftyMoves()) return { resultType: 'draw' }
}

export function resultText(state: GameState, color?: Color) {
  const result = state.gameResult
  if (result?.resultType === 'draw') return { title: 'Ничья', description: 'Партия завершилась вничью.' }
  if (result?.resultType === 'pat') return { title: 'Пат', description: 'Нет допустимых ходов. Партия завершилась вничью.' }
  const winner = result?.winColor
  const title = winner ? (!color ? `Победили ${winner === 'white' ? 'белые' : 'чёрные'}` : winner === color ? 'Вы победили' : 'Вы проиграли') : 'Партия завершена'
  const timedOut = state.timer && (state.timer.whiteTime <= 0 || state.timer.blackTime <= 0)
  return { title, description: timedOut ? 'У одного из игроков закончилось время.' : result?.resultType === 'mat' ? 'Мат. Спасибо за игру.' : result?.resultType === 'resignation' ? 'Партия завершена сдачей.' : 'Спасибо за игру.' }
}

export function systemNotice(message: string): string | undefined {
  if (message.includes('Draw offer sent')) return 'Предложение ничьей отправлено. Ожидаем ответ соперника.'
  if (/declined.*draw offer|Draw offer declined/i.test(message)) return 'Предложение ничьей отклонено. Игра продолжается.'
  if (message.includes('exhausted the draw offer limit')) return 'Можно предложить ничью не более двух раз за партию.'
  if (message.includes('already an active draw offer')) return 'Предложение ничьей уже отправлено. Дождитесь ответа.'
  if (/Not your turn|Invalid move/.test(message)) return 'Ход не принят сервером. Позиция будет восстановлена.'
  if (message.includes('disconnected')) return 'Соперник отключился. Он может вернуться в эту комнату.'
  if (message.includes('rejoined')) return 'Соперник вернулся в игру.'
  if (message.includes('Too many messages')) return 'Слишком много действий. Подождите несколько секунд.'
}
