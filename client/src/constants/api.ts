export const API_PREFIX = import.meta.env.VITE_TEST_MODE ? '/api' : '/api/api';
export const WS_URL = import.meta.env.VITE_TEST_MODE ? 'ws://localhost:4000/ws/room' : 'wss://game.chesson.me/ws/room';