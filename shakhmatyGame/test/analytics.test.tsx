import { StrictMode, type PropsWithChildren } from 'react'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { METRIKA_COUNTER, trackGoal, trackPage, trackRoomGoal } from '../src/lib/analytics'
import { useGameAnalytics } from '../src/hooks/useGameAnalytics'
import { usePageAnalytics } from '../src/hooks/usePageAnalytics'
import { useCreateRoom } from '../src/hooks/useCreateRoom'
import { defaultSettings } from '../src/lib/game'
import type { GameState } from '../src/types/game'

beforeEach(() => { sessionStorage.clear() })
const game = (patch: Partial<GameState> = {}): GameState => ({
  currentFEN: '', currentColor: 'white', currentPlayer: 'white', moveHistory: [],
  gameStarted: true, gameEnded: false,
  player: { userId: 'player', userName: 'Player', avatar: '0', color: 'white' }, ...patch,
})
const withMove = (): GameState['moveHistory'] => [{ FEN: 'position-after-move' } as GameState['moveHistory'][number]]

it('queues a single production initialization and disables automatic hits for SPA routing', () => {
  const html = readFileSync('index.html', 'utf8')
  const script = html.match(/<script type="text\/javascript">([\s\S]*?)<\/script>/)?.[1]
  expect(script).toBeTruthy()
  for (const mode of ['production', 'development']) {
    const inserted: unknown[] = []
    const context = {
      document: {
        scripts: [], createElement: () => ({}),
        getElementsByTagName: () => [{ parentNode: { insertBefore: (value: unknown) => inserted.push(value) } }],
      },
    } as Record<string, unknown>
    context.window = context
    runInNewContext(script!.replace('%MODE%', mode), context)
    if (mode === 'development') { expect(inserted).toHaveLength(0); expect(context.ym).toBeUndefined(); continue }
    expect(inserted).toHaveLength(1)
    expect(inserted[0]).toMatchObject({ async: 1, src: 'https://mc.yandex.ru/metrika/tag.js?id=113658367' })
    const calls = (context.ym as unknown as { a: unknown[][] }).a
    expect(calls).toHaveLength(1)
    expect(Array.from(calls[0]).slice(0, 2)).toEqual([METRIKA_COUNTER, 'init'])
    expect(calls[0][2]).toMatchObject({ defer: true, webvisor: true, clickmap: true, trackLinks: true, accurateTrackBounce: true })
  }
  expect(html).toContain('<noscript>')
  expect(html).toContain('https://mc.yandex.ru/watch/113658367')
})

it('tracking is safe when analytics is blocked, absent or throws', () => {
  vi.stubGlobal('ym', undefined)
  expect(trackGoal('play_click', { mode: 'friend' })).toBe(false)
  expect(trackPage('/')).toBe(false)
  vi.stubGlobal('ym', () => { throw new Error('Blocked') })
  expect(() => trackRoomGoal('room_created', 'blocked-analytics', {})).not.toThrow()
})

it('deduplicates room goals and excludes IDs from event parameters', () => {
  const ym = vi.fn(); vi.stubGlobal('ym', ym)
  trackRoomGoal('room_created', 'dedup-room', { mode: 'friend' })
  trackRoomGoal('room_created', 'dedup-room', { mode: 'friend' })
  expect(ym).toHaveBeenCalledExactlyOnceWith(METRIKA_COUNTER, 'reachGoal', 'room_created', { app: 'shakhmaty-game', mode: 'friend' })
  expect(sessionStorage.getItem(`metrika:${METRIKA_COUNTER}:room_created:dedup-room`)).toBe('1')
  sessionStorage.setItem(`metrika:${METRIKA_COUNTER}:room_created:restored-room`, '1')
  trackRoomGoal('room_created', 'restored-room', {})
  expect(ym).toHaveBeenCalledTimes(1)
})

it('uses memory deduplication when session storage is unavailable', () => {
  const ym = vi.fn(); vi.stubGlobal('ym', ym)
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
  trackRoomGoal('room_created', 'no-storage-room', {})
  trackRoomGoal('room_created', 'no-storage-room', {})
  expect(ym).toHaveBeenCalledTimes(1)
})

it('does not deduplicate a goal that could not be queued', () => {
  vi.stubGlobal('ym', undefined)
  trackRoomGoal('room_created', 'late-counter-room', {})
  const ym = vi.fn(); vi.stubGlobal('ym', ym)
  trackRoomGoal('room_created', 'late-counter-room', {})
  expect(ym).toHaveBeenCalledTimes(1)
})

it('counts initial and client-side page views once, without request IDs or query changes', () => {
  const ym = vi.fn(); vi.stubGlobal('ym', ym)
  function Wrapper({ children }: PropsWithChildren) {
    return <StrictMode><MemoryRouter initialEntries={['/create-room?mode=friend&requestId=secret']}>{children}</MemoryRouter></StrictMode>
  }
  const { result } = renderHook(() => { usePageAnalytics(); return useNavigate() }, { wrapper: Wrapper })
  expect(ym).toHaveBeenCalledTimes(1)
  expect(ym.mock.calls[0].slice(0, 3)).toEqual([METRIKA_COUNTER, 'hit', `${location.origin}/create-room`])
  act(() => { void result.current('/create-room?mode=bot&requestId=other') })
  expect(ym).toHaveBeenCalledTimes(1)
  act(() => { void result.current('/game/example-room') })
  expect(ym).toHaveBeenCalledTimes(2)
  expect(ym.mock.calls[1][3]).toMatchObject({ referer: `${location.origin}/create-room` })
  act(() => { void result.current('/') })
  expect(ym).toHaveBeenCalledTimes(3)
})

it.each(['friend', 'bot'] as const)('tracks %s play only after a move and completion only once', mode => {
  const ym = vi.fn(); vi.stubGlobal('ym', ym)
  const { result, rerender } = renderHook(() => useGameAnalytics(`played-${mode}`))
  result.current(game({ manualBotRoom: mode === 'bot', gameStarted: false }))
  result.current(game({ manualBotRoom: mode === 'bot' }))
  expect(ym).not.toHaveBeenCalled()
  const playing = game({ manualBotRoom: mode === 'bot', moveHistory: withMove() })
  result.current(playing)
  rerender()
  result.current(playing)
  expect(ym).toHaveBeenCalledExactlyOnceWith(METRIKA_COUNTER, 'reachGoal', 'game_started', { app: 'shakhmaty-game', mode })
  result.current({ ...playing, gameEnded: true })
  expect(ym).toHaveBeenCalledTimes(1)
  const ended = { ...playing, gameEnded: true, gameResult: { resultType: 'mat' as const, winColor: 'white' as const } }
  result.current(ended)
  result.current(ended)
  expect(ym).toHaveBeenLastCalledWith(METRIKA_COUNTER, 'reachGoal', 'game_completed', { app: 'shakhmaty-game', mode, result: 'mat' })
  expect(ym).toHaveBeenCalledTimes(2)
})

it('excludes spectators and opening already finished games', () => {
  const ym = vi.fn(); vi.stubGlobal('ym', ym)
  const { result } = renderHook(() => useGameAnalytics('spectator-analytics'))
  result.current(game({ isSpectator: true, moveHistory: withMove() }))
  result.current(game({ isSpectator: true, gameEnded: true, gameResult: { resultType: 'pat' } }))
  result.current(game({ gameEnded: true, moveHistory: withMove(), gameResult: { resultType: 'pat' } }))
  expect(ym).not.toHaveBeenCalled()
})

it('does not apply previous room activity to a different room', () => {
  const ym = vi.fn(); vi.stubGlobal('ym', ym)
  const { result, rerender } = renderHook(({ id }) => useGameAnalytics(id), { initialProps: { id: 'active-analytics' } })
  result.current(game())
  rerender({ id: 'already-ended-analytics' })
  result.current(game({ gameEnded: true, gameResult: { resultType: 'draw' } }))
  expect(ym).not.toHaveBeenCalled()
})

it('only counts successful room creation, including a retry and double submission', async () => {
  const ym = vi.fn(); vi.stubGlobal('ym', ym)
  const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ success: false }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, roomId: 'analytics-created' }) })
  vi.stubGlobal('fetch', fetch)
  const { result } = renderHook(useCreateRoom)
  await act(async () => { await result.current.create(defaultSettings('friend')) })
  expect(ym).not.toHaveBeenCalled()
  await act(async () => {
    const first = result.current.create(defaultSettings('friend'))
    const second = result.current.create(defaultSettings('friend'))
    expect(first).toBe(second)
    await first
  })
  expect(ym).toHaveBeenCalledExactlyOnceWith(METRIKA_COUNTER, 'reachGoal', 'room_created', {
    app: 'shakhmaty-game', mode: 'friend', time_minutes: defaultSettings('friend').timeMinutes, increment_seconds: 0,
  })
})
