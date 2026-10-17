import { Chess } from 'chess.js'

const roomId = process.argv[2]
if (!roomId) throw new Error('Usage: node test/integration-peer.mjs ROOM_ID')
const url = new URL('/ws/room', process.env.TEST_API_ORIGIN || 'http://127.0.0.1:4000')
url.protocol = 'ws:'
url.search = new URLSearchParams({ roomId, userName: 'Тестовый соперник', avatar: '0', clientId: crypto.randomUUID() })
const socket = new WebSocket(url)
let sentOpening = false, declined = false
const send = value => socket.send(JSON.stringify(value))
socket.onmessage = event => {
  const data = JSON.parse(event.data)
  if (data.type !== 'timerTick') console.log(data.type || 'system', data.message || data.gameState?.currentFEN || '')
  const state = data.gameState
  if (state?.gameStarted && !sentOpening && state.player?.color === 'white' && state.currentColor === 'white') {
    sentOpening = true
    const chess = new Chess(state.currentFEN)
    chess.move('e4')
    send({ type: 'move', moveData: { from: [4, 6], to: [4, 4], figure: { type: 'pawn', color: 'white' }, FEN: chess.fen() } })
  }
  if (data.type === 'drawOffer') {
    if (!declined) {
      declined = true
      send({ type: 'drawOffer', action: 'decline' })
      setTimeout(() => send({ type: 'drawOffer', action: 'offer' }), 1500)
    } else send({ type: 'drawOffer', action: 'accept' })
  }
  if (state?.gameEnded || data.type === 'gameEnd') socket.close(1000)
}
socket.onerror = error => { console.error(error); process.exitCode = 1 }
const timeout = setTimeout(() => socket.close(1000), 180_000)
socket.onclose = () => clearTimeout(timeout)
