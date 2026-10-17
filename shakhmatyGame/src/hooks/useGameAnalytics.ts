import { useCallback, useRef } from 'react'
import { trackRoomGoal } from '../lib/analytics'
import type { GameState } from '../types/game'

export function useGameAnalytics(roomId: string) {
  const activeRooms = useRef(new Set<string>())
  return useCallback((game: GameState) => {
    if (game.isSpectator || !game.player) return
    const mode = game.manualBotRoom ? 'bot' : 'friend'
    if (!game.gameEnded) {
      if (game.gameStarted) activeRooms.current.add(roomId)
      if (game.gameStarted && game.moveHistory.length > 0) trackRoomGoal('game_started', roomId, { mode })
      return
    }
    // Reopening an already finished room must not count as completing a new game.
    if (activeRooms.current.has(roomId) && game.gameResult) {
      trackRoomGoal('game_completed', roomId, { mode, result: game.gameResult.resultType })
    }
  }, [roomId])
}
