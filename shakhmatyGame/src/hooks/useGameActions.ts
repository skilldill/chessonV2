import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom'
import { clearRoom } from '../lib/storage'
import type { RoomConnection } from './useRoomConnection'

export type Confirmation = 'resign' | 'draw' | 'leave'

export function useGameActions(roomId: string, room: RoomConnection) {
  const navigate = useNavigate()
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [pending, setPending] = useState(false)
  const [exitAfterResult, setExitAfterResult] = useState(false)
  const allowNavigation = useRef(false)
  const active = !!room.game?.gameStarted && !room.game.gameEnded && !room.game.isSpectator
  const blocker = useBlocker(({ currentLocation, nextLocation }) => active && !allowNavigation.current && currentLocation.pathname !== nextLocation.pathname)
  useBeforeUnload(useCallback(event => { if (active && !allowNavigation.current) { event.preventDefault(); event.returnValue = '' } }, [active]))
  const leave = useCallback(() => {
    clearRoom(roomId)
    allowNavigation.current = true
    if (blocker.state === 'blocked') blocker.proceed()
    else navigate('/')
  }, [blocker, navigate, roomId])
  useEffect(() => {
    if (room.game?.gameEnded) { setPending(false); if (exitAfterResult) leave(); else setConfirmation(null) }
  }, [room.game?.gameEnded, exitAfterResult, leave])
  useEffect(() => {
    if (!pending) return
    const timeout = setTimeout(() => { setPending(false); setExitAfterResult(false); setConfirmation(null); room.notify('Сервер не подтвердил действие. Проверьте соединение и повторите попытку.') }, 10_000)
    return () => clearTimeout(timeout)
  }, [pending, room.notify])
  const confirm = () => {
    const action = blocker.state === 'blocked' ? 'leave' : confirmation
    if (action === 'leave' && (!active || room.status !== 'connected')) { leave(); return }
    if (!action || pending) return
    if (!room.send(action === 'draw' ? { type: 'drawOffer', action: 'offer' } : { type: 'resign' })) { room.notify('Нет соединения с сервером. Действие не отправлено.'); return }
    if (action === 'draw') setConfirmation(null)
    else { setPending(true); if (action === 'leave') setExitAfterResult(true) }
  }
  const cancel = () => { if (pending) return; setConfirmation(null); if (blocker.state === 'blocked') blocker.reset() }
  const respondDraw = (accept: boolean) => { if (!room.send({ type: 'drawOffer', action: accept ? 'accept' : 'decline' })) room.notify('Нет соединения с сервером. Ответ не отправлен.') }
  const canAct = active && room.status === 'connected' && !pending
  const drawLimit = room.game?.player ? (room.game.drawOfferCount?.[room.game.player.userId] ?? 0) >= 2 : false
  return { confirmation: blocker.state === 'blocked' ? 'leave' as const : confirmation, request: setConfirmation, pending, confirm, cancel, leave, respondDraw, canAct, canOfferDraw: canAct && !room.drawSent && !drawLimit && room.game?.drawOffer?.status !== 'pending' }
}
export type GameActions = ReturnType<typeof useGameActions>
