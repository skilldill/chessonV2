import { StockfishEngine } from './stockfish-engine';
import type { BotMoveRequest, BotMoveResult } from './types';

type Task<T> = () => Promise<T>;

class AsyncMutex {
  private queue: Promise<void> = Promise.resolve();

  runExclusive<T>(task: Task<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );

    return run;
  }
}

export class ChessBotService {
  private readonly engine: StockfishEngine;
  private readonly mutex = new AsyncMutex();

  constructor(engine?: StockfishEngine) {
    this.engine =
      engine ??
      new StockfishEngine({
        stockfishPath: process.env.STOCKFISH_PATH || 'stockfish',
      });
  }

  async start(): Promise<void> {
    await this.engine.start();
  }

  async stop(): Promise<void> {
    await this.engine.stop();
  }

  async getMove(request: BotMoveRequest): Promise<BotMoveResult> {
    return this.mutex.runExclusive(async () => {
      const result = await this.engine.getBestMove(request);
      await this.applyHumanLikeDelay();
      return result;
    });
  }

  private async applyHumanLikeDelay(): Promise<void> {
    const minMs = 500;
    const maxMs = 1_500;
    const delayMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

    await new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }
}
