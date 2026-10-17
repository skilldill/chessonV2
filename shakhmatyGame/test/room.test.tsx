import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Chess } from 'chess.js'
import { useRoomConnection } from '../src/hooks/useRoomConnection'
import { useCreateRoom } from '../src/hooks/useCreateRoom'
import { defaultSettings } from '../src/lib/game'
import type { GameState } from '../src/types/game'

const initial = (): GameState => ({ currentFEN: new Chess().fen(), currentColor: 'white', currentPlayer: 'white', gameStarted: true, gameEnded: false, moveHistory: [], player: { userId: 'a', userName: 'A', color: 'white', avatar: '0' }, opponent: { userId: 'b', userName: 'B', color: 'black', avatar: '0' } })
class MockSocket {
  static OPEN = 1; static instances: MockSocket[] = []
  readyState = 1
  sent: unknown[] = []
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(public url: string) { MockSocket.instances.push(this) }
  send(value: string) { this.sent.push(JSON.parse(value)) }
  close() { this.readyState = 3; this.onclose?.() }
  receive(data: unknown) { this.onmessage?.({ data: JSON.stringify(data) }) }
}
beforeEach(() => { MockSocket.instances = []; vi.stubGlobal('WebSocket', MockSocket); vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, json: async () => url.includes('/auth/') ? { success: false } : { gameState: initial() } }))) })

describe('room connection', () => {
  it('tracks play only after server confirmation, not after an optimistic board update', async () => {
    const ym = vi.fn(); vi.stubGlobal('ym', ym)
    const { result } = renderHook(() => useRoomConnection('analytics-authority'))
    await waitFor(() => expect(MockSocket.instances.length).toBe(1))
    const socket = MockSocket.instances[0]
    act(() => socket.receive({ type: 'connection', gameState: initial() }))
    const chess = new Chess(); chess.move('e4')
    const move = { from: [4, 6] as [number, number], to: [4, 4] as [number, number], figure: { type: 'pawn' as const, color: 'white' as const }, FEN: chess.fen() }
    act(() => { result.current.sendMove(move) })
    expect(ym).not.toHaveBeenCalled()
    const confirmed = { ...initial(), currentFEN: chess.fen(), moveHistory: [move] }
    act(() => socket.receive({ type: 'move', gameState: confirmed }))
    expect(ym).toHaveBeenCalledExactlyOnceWith(113658367, 'reachGoal', 'game_started', { app: 'shakhmaty-game', mode: 'friend' })
    act(() => socket.receive({ type: 'reconnection', gameState: confirmed }))
    expect(ym).toHaveBeenCalledTimes(1)
    act(() => socket.receive({ type: 'gameResult', gameResult: { resultType: 'pat' } }))
    act(() => socket.receive({ type: 'gameEnd' }))
    expect(ym).toHaveBeenLastCalledWith(113658367, 'reachGoal', 'game_completed', { app: 'shakhmaty-game', mode: 'friend', result: 'pat' })
    expect(ym).toHaveBeenCalledTimes(2)
  })
  it.each(['mat', 'pat'] as const)('applies a %s result even without a full game state', async (resultType) => {
    const { result } = renderHook(() => useRoomConnection('terminal-room'))
    await waitFor(() => expect(MockSocket.instances.length).toBe(1))
    const socket = MockSocket.instances[0]
    act(() => socket.receive({ type: 'connection', gameState: initial() }))
    const gameResult = resultType === 'mat' ? { resultType, winColor: 'black' } : { resultType }
    act(() => socket.receive({ type: 'gameResult', gameResult }))
    expect(result.current.game?.gameEnded).toBe(true)
    expect(result.current.game?.gameResult).toEqual(gameResult)
    expect(result.current.send({ type: 'resign' })).toBe(false)
    act(() => socket.receive({ type: 'gameEnd', message: 'Finished' }))
    expect(result.current.game?.gameResult).toEqual(gameResult)
  })
  it('reconnects with the same identity and restores the authoritative position', async () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() => useRoomConnection('restore-room'))
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    const first = MockSocket.instances[0]
    act(() => first.receive({ type: 'connection', gameState: initial() }))
    act(() => first.close())
    expect(result.current.status).toBe('reconnecting')
    await act(async () => { await vi.advanceTimersByTimeAsync(800) })
    const second = MockSocket.instances[1]
    expect(new URL(second.url).searchParams.get('clientId')).toBe(new URL(first.url).searchParams.get('clientId'))
    const chess = new Chess(); chess.move('e4')
    act(() => second.receive({ type: 'reconnection', gameState: { ...initial(), currentFEN: chess.fen(), currentColor: 'black' } }))
    expect(result.current.status).toBe('connected')
    expect(result.current.game?.currentFEN).toBe(chess.fen())
    expect(result.current.resetVersion).toBe(2)
    unmount()
  })
  it('waits for handshake, updates own moves and closes its socket on unmount', async () => {
    const { result, unmount } = renderHook(() => useRoomConnection('test-room'))
    await waitFor(() => expect(MockSocket.instances.length).toBe(1))
    const socket = MockSocket.instances[0]
    expect(result.current.send({ type: 'resign' })).toBe(false)
    act(() => socket.receive({ type: 'connection', gameState: initial(), userColor: 'white' }))
    expect(result.current.status).toBe('connected')
    const chess = new Chess(); chess.move('e4')
    act(() => { expect(result.current.sendMove({ from: [4, 6], to: [4, 4], figure: { type: 'pawn', color: 'white' }, FEN: chess.fen() })).toBe(true) })
    expect(result.current.game?.currentColor).toBe('black')
    expect(result.current.game?.moveHistory).toHaveLength(1)
    expect(socket.sent).toHaveLength(1)
    unmount(); expect(socket.readyState).toBe(3)
  })
  it('does not re-open a rejected draw after a timer tick', async () => {
    const { result } = renderHook(() => useRoomConnection('draw-room'))
    await waitFor(() => expect(MockSocket.instances.length).toBe(1))
    const socket = MockSocket.instances[0]
    act(() => socket.receive({ type: 'connection', gameState: { ...initial(), drawOffer: { from: 'b', to: 'a', status: 'pending' } } }))
    act(() => { result.current.send({ type: 'drawOffer', action: 'decline' }) })
    act(() => socket.receive({ type: 'timerTick', timer: { whiteTime: 590, blackTime: 600, initialWhiteTime: 600, initialBlackTime: 600 } }))
    expect(result.current.game?.drawOffer).toBeUndefined()
  })
  it('blocks spectator commands and preserves terminal result', async () => {
    const { result } = renderHook(() => useRoomConnection('spectator-room'))
    await waitFor(() => expect(MockSocket.instances.length).toBe(1))
    const socket = MockSocket.instances[0]
    act(() => socket.receive({ type: 'connection', gameState: { ...initial(), isSpectator: true } }))
    expect(result.current.send({ type: 'resign' })).toBe(false)
    act(() => socket.receive({ type: 'gameResult', gameState: { ...initial(), gameEnded: true, gameResult: { resultType: 'draw' } } }))
    act(() => socket.receive({ type: 'gameEnd', message: 'Draw' }))
    expect(result.current.game?.gameResult?.resultType).toBe('draw')
  })
})
it('room creation reuses requestId for retries and prevents double submission', async () => {
  const requests: unknown[] = []
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => { requests.push(JSON.parse(init.body)); return { ok: true, json: async () => requests.length === 1 ? { success: false } : { success: true, roomId: 'created-room' } } }))
  const { result } = renderHook(useCreateRoom)
  await act(async () => { await result.current.create(defaultSettings('friend')) })
  await act(async () => { const first = result.current.create(defaultSettings('friend')); const second = result.current.create(defaultSettings('friend')); expect(first).toBe(second); await first })
  expect(requests).toHaveLength(2)
  expect((requests[0] as { requestId: string }).requestId).toBe((requests[1] as { requestId: string }).requestId)
})
