import { useEffect, useState } from 'react'
import type { RoomConnection } from './useRoomConnection'
import type { GameActions } from './useGameActions'

export const RESULT_REVEAL_DELAY_MS = 1200

export function useGameDialogs(roomId: string, room: RoomConnection, actions: GameActions) {
  const [dismissedResult, setDismissedResult] = useState<string | null>(null)
  const [revealedResult, setRevealedResult] = useState<string | null>(null)
  const [dismissedNotice, setDismissedNotice] = useState(0)
  const { game, status } = room
  const resultKey = game?.gameEnded ? JSON.stringify([roomId, game.currentFEN, game.moveHistory.length, game.gameResult?.resultType, game.gameResult?.winColor]) : null
  const needsBoardPause = game?.gameResult?.resultType === 'mat' || game?.gameResult?.resultType === 'pat'

  useEffect(() => {
    if (status !== 'connected' || !resultKey || !needsBoardPause || dismissedResult === resultKey) return
    const timeout = setTimeout(() => setRevealedResult(resultKey), RESULT_REVEAL_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [resultKey, needsBoardPause, dismissedResult, status])

  const showResult = resultKey && dismissedResult !== resultKey && (!needsBoardPause || revealedResult === resultKey)
  const endedDialog = showResult ? 'result' : actions.confirmation === 'leave' ? 'confirmation' : null
  const incomingDraw = game?.drawOffer?.status === 'pending' && game.drawOffer.to === game.player?.userId
  const type = status !== 'connected' ? 'connection' : game?.gameEnded ? endedDialog : actions.confirmation ? 'confirmation'
    : incomingDraw && !game?.gameEnded ? 'draw' : !game?.gameEnded && room.notice && room.notice.id !== dismissedNotice ? 'notice' : game && !game.gameStarted && !game.gameEnded ? 'invitation' : null
  return { type, dismissResult: () => setDismissedResult(resultKey), dismissNotice: () => setDismissedNotice(room.notice?.id ?? 0) }
}
