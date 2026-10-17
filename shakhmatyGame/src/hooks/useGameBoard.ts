import { useCallback, useEffect, useRef, useState } from 'react'
import type { MoveData as BoardMove } from 'react-chessboard-ui'
import { normalizeMove, positionResult } from '../lib/game'
import type { RoomConnection } from './useRoomConnection'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export function useGameBoard(room: RoomConnection) {
  const { game, resetVersion, sendMove, notify, send } = room
  const color = game?.player?.color
  const reversed = !game?.isSpectator && color === 'black'
  const [board, setBoard] = useState<{ fen: string; change?: { move: BoardMove; withTransition: boolean }; version: number }>({ fen: START_FEN, version: 0 })
  const previous = useRef<{ fen: string; ply: number; reset: number; reversed: boolean } | null>(null)
  const localFen = useRef('')
  const reportedResult = useRef('')
  const fen = game?.currentFEN, moves = game?.moveHistory
  const canReportResult = !!game?.gameStarted && !game.gameEnded && !game.isSpectator && !!color && room.status === 'connected'

  const reportPositionResult = useCallback((currentFen: string) => {
    if (!canReportResult || reportedResult.current === currentFen) return
    const result = positionResult(currentFen)
    if (result && send({ type: 'gameResult', gameResult: result })) reportedResult.current = currentFen
  }, [canReportResult, send])

  useEffect(() => { reportedResult.current = '' }, [resetVersion])
  useEffect(() => {
    if (fen) reportPositionResult(fen)
    else reportedResult.current = ''
  }, [fen, resetVersion, reportPositionResult])

  useEffect(() => {
    if (!fen || !moves) return
    const prev = previous.current
    const reset = !prev || prev.reset !== resetVersion || prev.reversed !== reversed || moves.length < prev.ply || moves.length > prev.ply + 1
    if (reset) { setBoard(value => ({ fen, version: value.version + 1 })); localFen.current = '' }
    else if (prev.fen !== fen && localFen.current !== fen) {
      const move = moves.at(-1)
      if (move && moves.length === prev.ply + 1) setBoard(value => ({ ...value, change: { move, withTransition: true } }))
      else setBoard(value => ({ fen, version: value.version + 1 }))
    }
    previous.current = { fen, ply: moves.length, reset: resetVersion, reversed }
  }, [fen, moves, resetVersion, reversed])

  const resetBoard = useCallback(() => {
    if (game) setBoard(value => ({ fen: game.currentFEN, version: value.version + 1 }))
  }, [game])
  const onChange = useCallback((move: BoardMove) => {
    if (!game || game.gameEnded || game.isSpectator || room.status !== 'connected') { resetBoard(); return }
    try {
      const normalized = normalizeMove(game.currentFEN, move, reversed)
      localFen.current = normalized.FEN
      if (!sendMove(normalized)) { resetBoard(); notify('Не удалось отправить ход. Дождитесь восстановления соединения.'); return }
      reportPositionResult(normalized.FEN)
    } catch { resetBoard(); notify('Ход не принят. Позиция восстановлена.') }
  }, [game, reversed, sendMove, reportPositionResult, notify, resetBoard, room.status])
  const onEndGame = useCallback(() => {
    if (fen) reportPositionResult(fen)
  }, [fen, reportPositionResult])
  return { ...board, reversed, onChange, onEndGame, playerColor: color, viewOnly: !game?.gameStarted || game.gameEnded || !!game.isSpectator || room.status !== 'connected' || color !== game.currentColor }
}
