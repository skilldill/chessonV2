import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Chess } from 'chess.js'
import { useGameBoard } from '../src/hooks/useGameBoard'
import type { RoomConnection } from '../src/hooks/useRoomConnection'
import type { GameState, MoveData } from '../src/types/game'

function fixture(): RoomConnection {
  const game: GameState = { currentFEN: new Chess().fen(), currentColor: 'white', currentPlayer: 'white', gameStarted: true, gameEnded: false, moveHistory: [], player: { userId: 'a', userName: 'A', avatar: '0', color: 'white' } }
  return { game, status: 'connected', resetVersion: 1, notice: undefined, error: '', drawSent: false, send: vi.fn(() => true), sendMove: vi.fn(() => true), retry: vi.fn(), notify: vi.fn() }
}
describe('board synchronization', () => {
  it('retries a result when its previous send failed', () => {
    const room = fixture()
    room.game = { ...room.game!, currentFEN: '7k/5K2/6Q1/8/8/8/8/8 b - - 0 1' }
    vi.mocked(room.send).mockReturnValueOnce(false)
    const { result } = renderHook(() => useGameBoard(room))
    act(() => result.current.onEndGame())
    expect(room.send).toHaveBeenCalledTimes(2)
  })
  it('reports checkmate after a local move against a bot', () => {
    const chess = new Chess()
    for (const move of ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6']) chess.move(move)
    const room = fixture()
    room.game = { ...room.game!, manualBotRoom: true, currentFEN: chess.fen() }
    const { result } = renderHook(() => useGameBoard(room))
    act(() => result.current.onChange({ from: [7, 3], to: [5, 1], figure: { type: 'queen', color: 'white' } }))
    expect(room.send).toHaveBeenCalledExactlyOnceWith({ type: 'gameResult', gameResult: { resultType: 'mat', winColor: 'white' } })
  })
  it('detects checkmate from a bot move without relying on the 3D callback', () => {
    const chess = new Chess()
    for (const move of ['f3', 'e5', 'g4']) chess.move(move)
    let room = fixture()
    room.game = { ...room.game!, manualBotRoom: true, currentFEN: chess.fen(), currentColor: 'black' }
    const { result, rerender } = renderHook(() => useGameBoard(room))
    chess.move('Qh4#')
    const remote: MoveData = { from: [3, 0], to: [7, 4], figure: { type: 'queen', color: 'black' }, FEN: chess.fen() }
    room = { ...room, game: { ...room.game!, currentFEN: remote.FEN, currentColor: 'white', moveHistory: [remote] } }
    rerender()
    act(() => { result.current.onEndGame(); result.current.onEndGame() })
    expect(room.send).toHaveBeenCalledExactlyOnceWith({ type: 'gameResult', gameResult: { resultType: 'mat', winColor: 'black' } })
  })
  it('reports stalemate after a local move against a bot', () => {
    const room = fixture()
    room.game = { ...room.game!, manualBotRoom: true, currentFEN: '7k/5K2/8/6Q1/8/8/8/8 w - - 0 1' }
    const { result } = renderHook(() => useGameBoard(room))
    act(() => result.current.onChange({ from: [6, 3], to: [6, 2], figure: { type: 'queen', color: 'white' } }))
    expect(room.send).toHaveBeenCalledExactlyOnceWith({ type: 'gameResult', gameResult: { resultType: 'pat' } })
  })
  it('detects a terminal position when reconnecting, and retries an unacknowledged result', () => {
    let room = fixture()
    room.game = { ...room.game!, currentFEN: '7k/5K2/6Q1/8/8/8/8/8 b - - 0 1', currentColor: 'black' }
    const { result, rerender } = renderHook(() => useGameBoard(room))
    expect(room.send).toHaveBeenCalledTimes(1)
    act(() => result.current.onEndGame())
    expect(room.send).toHaveBeenCalledTimes(1)
    room = { ...room, resetVersion: 2 }; rerender()
    expect(room.send).toHaveBeenCalledTimes(2)
  })
  it.each(['spectator', 'offline', 'finished', 'waiting'] as const)('does not report results while %s', (mode) => {
    const room = fixture()
    room.game = { ...room.game!, currentFEN: '7k/5K2/6Q1/8/8/8/8/8 b - - 0 1', isSpectator: mode === 'spectator', gameEnded: mode === 'finished', gameStarted: mode !== 'waiting' }
    if (mode === 'offline') room.status = 'offline'
    const { result } = renderHook(() => useGameBoard(room))
    act(() => result.current.onEndGame())
    expect(room.send).not.toHaveBeenCalled()
    expect(result.current.viewOnly).toBe(true)
  })
  it('keeps local moves local, animates opponent moves and resets on reconnect', () => {
    let room = fixture()
    const { result, rerender } = renderHook(() => useGameBoard(room))
    const initialVersion = result.current.version
    act(() => result.current.onChange({ from: [4, 6], to: [4, 4], figure: { type: 'pawn', color: 'white' } }))
    const local = vi.mocked(room.sendMove).mock.calls[0][0]
    room = { ...room, game: { ...room.game!, currentFEN: local.FEN, currentColor: 'black', moveHistory: [local] } }
    rerender(); expect(result.current.change).toBeUndefined(); expect(result.current.viewOnly).toBe(true)
    const chess = new Chess(local.FEN); chess.move('e5')
    const remote: MoveData = { from: [4, 1], to: [4, 3], figure: { color: 'black', type: 'pawn' }, FEN: chess.fen() }
    room = { ...room, game: { ...room.game!, currentFEN: remote.FEN, currentColor: 'white', moveHistory: [local, remote] } }
    rerender(); expect(result.current.change?.move).toEqual(remote); expect(result.current.viewOnly).toBe(false)
    room = { ...room, resetVersion: 2 }; rerender()
    expect(result.current.version).toBeGreaterThan(initialVersion); expect(result.current.fen).toBe(remote.FEN); expect(result.current.change).toBeUndefined()
  })
  it('normalizes the black orientation and prevents moves without a connection', () => {
    const chess = new Chess(); chess.move('e4')
    let room = fixture(); room.game = { ...room.game!, currentFEN: chess.fen(), currentColor: 'black', player: { ...room.game!.player!, color: 'black' } }
    const { result, rerender } = renderHook(() => useGameBoard(room))
    expect(result.current.reversed).toBe(true)
    act(() => result.current.onChange({ from: [3, 6], to: [3, 4], figure: { type: 'pawn', color: 'black' } }))
    expect(room.sendMove).toHaveBeenCalledWith(expect.objectContaining({ from: [4, 1], to: [4, 3] }))
    vi.mocked(room.sendMove).mockClear(); room = { ...room, status: 'offline' }; rerender()
    act(() => result.current.onChange({ from: [3, 6], to: [3, 4], figure: { type: 'pawn', color: 'black' } }))
    expect(room.sendMove).not.toHaveBeenCalled(); expect(result.current.viewOnly).toBe(true)
  })
})
