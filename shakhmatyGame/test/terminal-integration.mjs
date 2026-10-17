import assert from 'node:assert/strict';
import { Chess } from 'chess.js';

const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:4000';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname), 'Use a local test API, not production');

const mate = new Chess();
for (const move of ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6']) mate.move(move);
const cases = [
  { name: 'mate', chess: mate, move: 'Qxf7#', gameResult: { resultType: 'mat', winColor: 'white' } },
  { name: 'stalemate', chess: new Chess('7k/5K2/8/6Q1/8/8/8/8 w - - 0 1'), move: 'Qg6', gameResult: { resultType: 'pat' } },
];
const pieceNames = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn', k: 'king' };
const coords = (square) => [square.charCodeAt(0) - 97, 8 - Number(square[1])];

for (const { name, chess, move, gameResult } of cases) {
  const currentFEN = chess.fen();
  const played = chess.move(move);
  const finalFEN = chess.fen();
  const response = await fetch(`${origin}/api/rooms`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentFEN, requestId: crypto.randomUUID(), vsBot: true, color: 'white', whiteTimer: 600, blackTimer: 600, increment: 0, gameMode: 'standard' }),
    signal: AbortSignal.timeout(5000),
  });
  assert.ok(response.ok);
  const { roomId, success } = await response.json();
  assert.ok(success);
  const url = new URL('/ws/room', origin);
  url.protocol = 'ws:';
  url.search = new URLSearchParams({ roomId, clientId: crypto.randomUUID(), userName: 'Terminal test', avatar: '0' });
  const socket = new WebSocket(url);
  try {
    await new Promise((resolve, reject) => {
      let sent = false;
      const timeout = setTimeout(() => reject(new Error(`${name}: no result received`)), 10_000);
      const finish = (error) => { clearTimeout(timeout); error ? reject(error) : resolve(); };
      socket.onerror = () => finish(new Error('Local WebSocket failed'));
      socket.onclose = () => finish(new Error('Socket closed before result'));
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.gameState?.gameStarted && !sent) {
            sent = true;
            socket.send(JSON.stringify({ type: 'move', moveData: { from: coords(played.from), to: coords(played.to), figure: { type: pieceNames[played.piece], color: 'white' }, FEN: finalFEN } }));
            // Deliberately send immediately: server-side move resolution is asynchronous.
            socket.send(JSON.stringify({ type: 'gameResult', gameResult }));
          }
          if (data.type === 'gameResult') {
            assert.equal(data.gameState.currentFEN, finalFEN, `${name}: result must include the last move`);
            assert.equal(data.gameState.gameEnded, true);
            assert.deepEqual(data.gameResult, gameResult);
            finish();
          }
        } catch (error) { finish(error); }
      };
    });
    const { gameState } = await (await fetch(`${origin}/api/rooms/${roomId}`, { signal: AbortSignal.timeout(5000) })).json();
    assert.equal(gameState.currentFEN, finalFEN);
    assert.deepEqual(gameState.gameResult, gameResult);
    console.log(`${name}: final move, authoritative result and stored position passed`);
  } finally { socket.onclose = null; socket.onerror = null; socket.onmessage = null; socket.close(); }
}
