import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { defaultSettings, normalizeMove, parseEntry, positionResult, roomPayload } from '../src/lib/game'

describe('landing and room creation contract', () => {
  it('keeps timers, bot settings, colors and the idempotency key', () => {
    const settings = parseEntry('?mode=bot&autoStart=1&timeMinutes=3&incrementSeconds=2&botDifficulty=hard&color=black&requestId=abcdefghijklmnop')!
    expect(roomPayload(settings, settings.requestId)).toMatchObject({ requestId: 'abcdefghijklmnop', whiteTimer: 180, blackTimer: 180, increment: 2, vsBot: true, color: 'black', botDifficulty: 'hard', botMoveTimeMs: 800 })
    expect(roomPayload(defaultSettings('friend'), 'test')).not.toHaveProperty('botDifficulty')
  })
  it.each(['', '?mode=friend', '?mode=friend&autoStart=1&timeMinutes=7&incrementSeconds=0', '?mode=bot&autoStart=1&timeMinutes=3&incrementSeconds=0&color=red', '?mode=bot&autoStart=1&timeMinutes=3&incrementSeconds=0&timeMinutes=5', '?mode=bot&autoStart=1&timeMinutes=3&incrementSeconds=0&requestId=../bad'])('rejects invalid entry %s', search => expect(parseEntry(search)).toBeNull())
  it('rejects inherited object keys as bot difficulty', () => expect(parseEntry('?mode=bot&autoStart=1&timeMinutes=3&incrementSeconds=0&botDifficulty=__proto__')).toBeNull())
})
describe('board to server moves', () => {
  it('normalizes white and reversed black moves without trusting the board FEN', () => {
    const white = normalizeMove(new Chess().fen(), { from: [4, 6], to: [4, 4], figure: { type: 'pawn', color: 'white' }, FEN: 'invalid' }, false)
    expect(white.FEN.split(' ')[1]).toBe('b')
    const black = normalizeMove(white.FEN, { from: [3, 6], to: [3, 4], figure: { type: 'pawn', color: 'black' } }, true)
    expect(black.from).toEqual([4, 1]); expect(black.to).toEqual([4, 3]); expect(new Chess(black.FEN).get('e5')?.color).toBe('b')
  })
  it('preserves castling and en passant', () => {
    const castle = normalizeMove('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', { from: [4, 7], to: [6, 7], figure: { type: 'king', color: 'white' } }, false)
    expect(new Chess(castle.FEN).get('f1')?.type).toBe('r')
    const game = new Chess(); for (const move of ['e4', 'a6', 'e5', 'd5']) game.move(move)
    const enPassant = normalizeMove(game.fen(), { from: [4, 3], to: [3, 2], figure: { type: 'pawn', color: 'white' } }, false)
    expect(new Chess(enPassant.FEN).get('d5')).toBeUndefined()
  })
  it('handles promotion for black when the board is reversed', () => {
    const move = normalizeMove('7k/8/8/8/8/8/p7/7K b - - 0 1', { from: [7, 1], to: [7, 0], type: 'transform', figure: { type: 'knight', color: 'black' } }, true)
    expect(move.type).toBe('transform'); expect(new Chess(move.FEN).get('a1')).toMatchObject({ type: 'n', color: 'b' })
  })
  it('rejects illegal moves and detects checkmate', () => {
    expect(() => normalizeMove(new Chess().fen(), { from: [4, 6], to: [4, 3], figure: { type: 'pawn', color: 'white' } }, false)).toThrow()
    const game = new Chess(); for (const move of ['f3', 'e5', 'g4', 'Qh4#']) game.move(move)
    expect(positionResult(game.fen())).toEqual({ resultType: 'mat', winColor: 'black' })
  })
})
