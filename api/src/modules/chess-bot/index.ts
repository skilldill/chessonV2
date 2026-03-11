import { ChessBotService } from './chess-bot.service';

export * from './types';
export { StockfishEngine } from './stockfish-engine';
export { ChessBotService } from './chess-bot.service';

export const chessBot = new ChessBotService();
