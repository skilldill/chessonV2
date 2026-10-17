import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchJSON, roomSocketUrl } from '../lib/api'
import { clearRoom, saveRoom } from '../lib/storage'
import { isRoomId, systemNotice } from '../lib/game'
import type { ClientMessage, ConnectionStatus, GameState, MoveData, ServerMessage } from '../types/game'
import { usePlayerIdentity } from './usePlayerIdentity'

type Session = { game: GameState | null; status: ConnectionStatus; resetVersion: number; notice?: { id: number; text: string }; drawSent: boolean; error: string }
const initialSession: Session = { game: null, status: 'loading', resetVersion: 0, drawSent: false, error: '' }

export function useRoomConnection(roomId: string) {
  const identity = usePlayerIdentity()
  const [session, setSession] = useState<Session>(initialSession)
  const [attempt, setAttempt] = useState(0)
  const socketRef = useRef<WebSocket | null>(null)
  const gameRef = useRef<GameState | null>(null)
  const connectedRef = useRef(false)
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  const notify = useCallback((text: string) => setSession(prev => ({ ...prev, notice: { id: (prev.notice?.id ?? 0) + 1, text } })), [])

  useEffect(() => {
    if (!identity) return
    if (!isRoomId(roomId)) { setSession({ ...initialSession, status: 'expired' }); return }
    let disposed = false, reconnects = 0, handshaken = false, lastReceived = Date.now()
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let connectTimer: ReturnType<typeof setTimeout> | undefined
    let checking = false
    const controller = new AbortController()
    gameRef.current = null
    connectedRef.current = false
    setSession(initialSession)
    const update = (patch: Partial<Session>) => { if (!disposed) setSession(prev => ({ ...prev, ...patch })) }
    const apply = (game: GameState, reset = false) => {
      if (!game || typeof game.currentFEN !== 'string' || !Array.isArray(game.moveHistory)) return
      gameRef.current = game
      if (game.gameEnded || game.isSpectator) clearRoom(roomId)
      else saveRoom(roomId)
      setSession(prev => ({ ...prev, game, resetVersion: prev.resetVersion + Number(reset), ...(game.gameEnded ? { drawSent: false } : {}) }))
    }
    const roomExists = async () => {
      const data = await fetchJSON<{ gameState?: GameState }>(`/rooms/${roomId}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) })
      if (!data.gameState) { clearRoom(roomId); update({ status: 'expired', error: 'Комната не найдена или срок её хранения истёк.' }); return false }
      return true
    }
    const connect = async () => {
      clearTimeout(connectTimer)
      handshaken = false
      connectedRef.current = false
      update({ status: reconnects ? 'reconnecting' : 'connecting', error: '' })
      try {
        if (!await roomExists() || disposed) return
        const socket = new WebSocket(roomSocketUrl(roomId, identity, identity.token))
        socketRef.current = socket
        connectTimer = setTimeout(() => { if (!disposed && !handshaken) socket.close() }, 8000)
        socket.onmessage = event => {
          if (disposed || socketRef.current !== socket) return
          lastReceived = Date.now()
          let data: ServerMessage
          try { data = JSON.parse(event.data) as ServerMessage } catch { return }
          if (data.type === 'roomExpired') { update({ status: 'expired' }); clearRoom(roomId); socket.onclose = null; socket.close(1000); return }
          if (data.gameState) {
            const game = { ...data.gameState }
            if (!game.isSpectator && game.player && data.userColor) game.player = { ...game.player, color: data.userColor }
            apply(game, data.type === 'connection' || data.type === 'reconnection')
          }
          if (data.type === 'connection' || data.type === 'reconnection') {
            handshaken = true; connectedRef.current = true; reconnects = 0; clearTimeout(connectTimer); update({ status: 'connected', error: '' })
          }
          if (data.type === 'timerTick' && data.timer && gameRef.current) apply({ ...gameRef.current, timer: data.timer })
          if ((data.type === 'gameEnd' || data.type === 'gameResult') && gameRef.current) apply({ ...gameRef.current, gameEnded: true, gameResult: data.gameResult ?? gameRef.current.gameResult, drawOffer: undefined })
          if (data.message && data.system) {
            const notice = systemNotice(data.message)
            if (notice) notify(notice)
            if (/declined|exhausted|No active draw offer/.test(data.message)) {
              update({ drawSent: false })
              if (gameRef.current) apply({ ...gameRef.current, drawOffer: undefined })
            }
            if (/Not your turn|Invalid move/.test(data.message)) { socket.onclose = null; socket.close(1000); scheduleReconnect() }
          }
        }
        socket.onclose = () => { if (!disposed && socketRef.current === socket) { handshaken = false; connectedRef.current = false; scheduleReconnect() } }
        socket.onerror = () => socket.close()
      } catch {
        if (!disposed) scheduleReconnect()
      }
    }
    const scheduleReconnect = () => {
      clearTimeout(connectTimer)
      clearTimeout(reconnectTimer)
      if (disposed) return
      if (!navigator.onLine || reconnects >= 5) { update({ status: 'offline', error: 'Соединение потеряно. Позиция сохранена на сервере.' }); return }
      update({ status: 'reconnecting' })
      reconnectTimer = setTimeout(() => { void connect() }, Math.min(800 * 2 ** reconnects++, 8000))
    }
    const goOnline = () => { if (!handshaken) { reconnects = 0; clearTimeout(reconnectTimer); void connect() } }
    const goOffline = () => { socketRef.current?.close(); update({ status: 'offline' }) }
    // The room protocol has no application-level ping. Check idle sockets via HTTP instead.
    const watchdog = setInterval(async () => {
      if (disposed || checking || !handshaken || document.hidden || Date.now() - lastReceived < 25_000) return
      checking = true
      try {
        const exists = await roomExists()
        if (!disposed && !exists) { const ws = socketRef.current; if (ws) { ws.onclose = null; ws.close(1000) } }
      } catch { if (!disposed) { socketRef.current?.close(); update({ status: 'reconnecting' }) } }
      finally { checking = false; lastReceived = Date.now() }
    }, 10_000)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    void connect()
    return () => {
      disposed = true; connectedRef.current = false; controller.abort(); clearInterval(watchdog); clearTimeout(connectTimer); clearTimeout(reconnectTimer)
      window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline)
      const socket = socketRef.current
      if (socket) { socket.onclose = null; socket.onmessage = null; socket.onerror = null; socket.close(1000, 'Leaving room') }
      socketRef.current = null
    }
  }, [roomId, identity, attempt, notify])

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current, game = gameRef.current
    if (!connectedRef.current || !socket || socket.readyState !== WebSocket.OPEN || !game || game.isSpectator || game.gameEnded) return false
    socket.send(JSON.stringify(message))
    if (message.type === 'drawOffer') {
      if (message.action !== 'offer') gameRef.current = { ...game, drawOffer: undefined }
      setSession(prev => ({ ...prev, drawSent: message.action === 'offer', game: gameRef.current }))
    }
    return true
  }, [])
  const sendMove = useCallback((move: MoveData) => {
    const game = gameRef.current
    if (!game?.gameStarted || game.player?.color !== game.currentColor || !send({ type: 'move', moveData: move })) return false
    const currentColor = move.FEN.split(' ')[1] === 'w' ? 'white' : 'black'
    const updated = { ...game, currentFEN: move.FEN, currentColor, currentPlayer: currentColor, moveHistory: [...game.moveHistory, move] } as GameState
    gameRef.current = updated
    setSession(prev => ({ ...prev, game: updated }))
    return true
  }, [send])
  return { ...session, send, sendMove, retry, notify }
}

export type RoomConnection = ReturnType<typeof useRoomConnection>
