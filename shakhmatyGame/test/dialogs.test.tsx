import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { RESULT_REVEAL_DELAY_MS, useGameDialogs } from '../src/hooks/useGameDialogs'
import type { GameActions } from '../src/hooks/useGameActions'
import type { RoomConnection } from '../src/hooks/useRoomConnection'
import { GameDialogs } from '../src/components/GameDialogs'

const room = (): RoomConnection => ({ status: 'connected', game: { currentFEN: '', currentColor: 'white', currentPlayer: 'white', moveHistory: [], gameStarted: true, gameEnded: false, player: { userId: 'a', userName: 'A', avatar: '0', color: 'white' } }, error: '', resetVersion: 1, drawSent: false, send: vi.fn(() => true), sendMove: vi.fn(() => true), retry: vi.fn(), notify: vi.fn() })
const actions: GameActions = { confirmation: null, pending: false, canAct: true, canOfferDraw: true, request: vi.fn(), confirm: vi.fn(), cancel: vi.fn(), leave: vi.fn(), respondDraw: vi.fn() }

it('never resurfaces an old draw notice after the result is dismissed', () => {
  const state = room(); state.game!.gameEnded = true; state.notice = { id: 1, text: 'Old draw notice' }
  const { result } = renderHook(() => useGameDialogs('test-room', state, actions))
  expect(result.current.type).toBe('result')
  act(() => result.current.dismissResult())
  expect(result.current.type).toBeNull()
})
it('prioritizes incoming draw requests over older notices', () => {
  const state = room(); state.game!.drawOffer = { from: 'b', to: 'a', status: 'pending' }; state.notice = { id: 1, text: 'Old notice' }
  const { result } = renderHook(() => useGameDialogs('test-room', state, actions))
  expect(result.current.type).toBe('draw')
})
it('shows invitation before the game starts and connection state on network loss', () => {
  let state = room(); state.game!.gameStarted = false
  const { result, rerender } = renderHook(() => useGameDialogs('test-room', state, actions))
  expect(result.current.type).toBe('invitation')
  state = { ...state, status: 'offline' }; rerender()
  expect(result.current.type).toBe('connection')
})

it.each([
  { gameResult: { resultType: 'mat' as const, winColor: 'white' as const }, title: 'Вы победили', description: 'Мат. Спасибо за игру.' },
  { gameResult: { resultType: 'mat' as const, winColor: 'black' as const }, title: 'Вы проиграли', description: 'Мат. Спасибо за игру.' },
  { gameResult: { resultType: 'pat' as const }, title: 'Пат', description: 'Нет допустимых ходов. Партия завершилась вничью.' },
])('shows the terminal dialog: $title', ({ gameResult, title, description }) => {
  vi.useFakeTimers()
  const state = room()
  state.game = { ...state.game!, gameEnded: true, gameResult }
  render(<GameDialogs roomId="finished-room" room={state} actions={actions} />)
  expect(screen.queryByRole('dialog')).toBeNull()
  act(() => vi.advanceTimersByTime(RESULT_REVEAL_DELAY_MS))
  expect(screen.getByRole('dialog').textContent).toContain(title)
  expect(screen.getByText(description)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Посмотреть доску' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  act(() => vi.advanceTimersByTime(RESULT_REVEAL_DELAY_MS * 2))
  expect(screen.queryByRole('dialog')).toBeNull()
})

it.each(['mat', 'pat'] as const)('leaves the board unobstructed before revealing %s', (resultType) => {
  vi.useFakeTimers()
  let state = room()
  const { result, rerender } = renderHook(() => useGameDialogs('test-room', state, { ...actions, confirmation: 'resign' }))
  state = { ...state, notice: { id: 1, text: 'Old notice' }, game: { ...state.game!, gameEnded: true, gameResult: { resultType } } }
  rerender()
  expect(result.current.type).toBeNull()
  act(() => vi.advanceTimersByTime(RESULT_REVEAL_DELAY_MS - 1))
  expect(result.current.type).toBeNull()
  // Duplicate result frames and timer updates must not restart the pause.
  state = { ...state, game: { ...state.game!, gameResult: { resultType } } }
  rerender()
  act(() => vi.advanceTimersByTime(1))
  expect(result.current.type).toBe('result')
})

it.each(['resignation', 'draw'] as const)('does not delay %s', (resultType) => {
  const state = room()
  state.game = { ...state.game!, gameEnded: true, gameResult: { resultType } }
  const { result } = renderHook(() => useGameDialogs('test-room', state, actions))
  expect(result.current.type).toBe('result')
})

it('cancels the old timer when leaving a room and delays the next room independently', () => {
  vi.useFakeTimers()
  let roomId = 'first-room'
  let state = room()
  state.game = { ...state.game!, gameEnded: true, gameResult: { resultType: 'pat' } }
  const { result, rerender, unmount } = renderHook(() => useGameDialogs(roomId, state, actions))
  act(() => vi.advanceTimersByTime(600))
  roomId = 'second-room'; state = room(); rerender()
  expect(vi.getTimerCount()).toBe(0)
  act(() => vi.advanceTimersByTime(600))
  expect(result.current.type).toBeNull()
  state = { ...state, game: { ...state.game!, gameEnded: true, gameResult: { resultType: 'pat' } } }; rerender()
  act(() => vi.advanceTimersByTime(RESULT_REVEAL_DELAY_MS - 1))
  expect(result.current.type).toBeNull()
  act(() => vi.advanceTimersByTime(1))
  expect(result.current.type).toBe('result')
  act(() => result.current.dismissResult())
  roomId = 'third-room'; rerender()
  expect(result.current.type).toBeNull()
  expect(vi.getTimerCount()).toBe(1)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it('waits again if the final position changes during the pause', () => {
  vi.useFakeTimers()
  let state = room()
  state.game = { ...state.game!, gameEnded: true, gameResult: { resultType: 'mat', winColor: 'black' } }
  const { result, rerender } = renderHook(() => useGameDialogs('test-room', state, actions))
  act(() => vi.advanceTimersByTime(600))
  state = { ...state, game: { ...state.game!, currentFEN: 'final-position' } }; rerender()
  act(() => vi.advanceTimersByTime(RESULT_REVEAL_DELAY_MS - 1))
  expect(result.current.type).toBeNull()
  act(() => vi.advanceTimersByTime(1))
  expect(result.current.type).toBe('result')
})

it('starts a fresh pause after a connection dialog covered the final position', () => {
  vi.useFakeTimers()
  let state = room()
  state.game = { ...state.game!, gameEnded: true, gameResult: { resultType: 'pat' } }
  const { result, rerender } = renderHook(() => useGameDialogs('test-room', state, actions))
  act(() => vi.advanceTimersByTime(600))
  state = { ...state, status: 'reconnecting' }; rerender()
  expect(result.current.type).toBe('connection')
  act(() => vi.advanceTimersByTime(RESULT_REVEAL_DELAY_MS))
  state = { ...state, status: 'connected' }; rerender()
  expect(result.current.type).toBeNull()
  act(() => vi.advanceTimersByTime(RESULT_REVEAL_DELAY_MS - 1))
  expect(result.current.type).toBeNull()
  act(() => vi.advanceTimersByTime(1))
  expect(result.current.type).toBe('result')
})
