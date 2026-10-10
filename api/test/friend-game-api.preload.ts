import { mock } from 'bun:test';

// Only engine startup is stubbed; HTTP room creation and WebSocket joins stay real.
const lifecycle = { start: async () => {}, stop: async () => {} };
mock.module(new URL('../src/modules/chess-bot/index.ts', import.meta.url).pathname, () => ({
    chessBot: lifecycle,
}));
mock.module(new URL('../src/modules/game-analysis/game-analysis.service.ts', import.meta.url).pathname, () => ({
    gameAnalysisService: lifecycle,
}));
