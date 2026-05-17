import { Game } from '../../../models/Game';
import { GameAnalysis } from '../../../models/GameAnalysis';
import { AnalysisEngine } from './analysis-engine';
import { calculateQualityBasedAccuracy, classifyMove, getMoveLossCp, scoreCpToPawns } from './analysis-classifier';
import { getReadableAnalysisNotation, getReadableUciNotation, uciToCoords } from './notation';
import type { AnalysisCounter, AnalysisMoveData, AnalysisSideSummary, EngineEvaluation, GameAnalysisResult } from './types';

type Subscriber = {
  send: (event: string, data: unknown) => void;
  close: () => void;
};

const DEFAULT_ANALYSIS_MOVE_TIME_MS = Number.parseInt(process.env.ANALYSIS_MOVE_TIME_MS || '100', 10);
const STALE_RUNNING_MS = 10 * 60 * 1000;
const ANALYSIS_VERSION = 7;

function emptyCounter(): AnalysisCounter {
  return {
    excellent: 0,
    good: 0,
    bad: 0,
    blunder: 0,
  };
}

function emptySideSummary(): AnalysisSideSummary {
  return {
    ...emptyCounter(),
    accuracy: 100,
    averageLossCp: 0,
  };
}

export class GameAnalysisService {
  private readonly runningGameIds = new Set<string>();
  private readonly subscribers = new Map<string, Set<Subscriber>>();
  private readonly queue: Promise<void> = Promise.resolve();
  private queueTail: Promise<void> = this.queue;

  constructor(private readonly engine: AnalysisEngine) {}

  async start(): Promise<void> {
    await this.engine.start();
  }

  async stop(): Promise<void> {
    for (const subscribers of this.subscribers.values()) {
      for (const subscriber of subscribers) {
        subscriber.close();
      }
    }

    this.subscribers.clear();
    await this.engine.stop();
  }

  async getOrStart(gameId: string) {
    const existing = await GameAnalysis.findOne({ gameId }).lean();

    if (existing?.status === 'done' && existing.analysisVersion === ANALYSIS_VERSION) {
      return existing;
    }

    if (existing?.status === 'running' && !this.isStale(existing.startedAt)) {
      if (!this.runningGameIds.has(gameId)) {
        this.enqueue(gameId);
      }

      return existing;
    }

    const analysis = await GameAnalysis.findOneAndUpdate(
      { gameId },
      {
        $set: {
          status: 'running',
          analysisVersion: ANALYSIS_VERSION,
          progressCurrent: 0,
          progressTotal: existing?.progressTotal ?? 0,
          startedAt: new Date(),
          finishedAt: undefined,
          error: undefined,
          result: undefined,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    this.enqueue(gameId);
    return analysis;
  }

  async retry(gameId: string) {
    await GameAnalysis.findOneAndUpdate(
      { gameId },
      {
        $set: {
          status: 'running',
          analysisVersion: ANALYSIS_VERSION,
          progressCurrent: 0,
          progressTotal: 0,
          startedAt: new Date(),
          finishedAt: undefined,
          error: undefined,
          result: undefined,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    this.enqueue(gameId);
    return this.getOrStart(gameId);
  }

  subscribe(gameId: string, subscriber: Subscriber): () => void {
    const subscribers = this.subscribers.get(gameId) ?? new Set<Subscriber>();
    subscribers.add(subscriber);
    this.subscribers.set(gameId, subscribers);

    void this.sendSnapshot(gameId, subscriber);

    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        this.subscribers.delete(gameId);
      }
    };
  }

  private enqueue(gameId: string): void {
    if (this.runningGameIds.has(gameId)) {
      return;
    }

    this.runningGameIds.add(gameId);
    this.queueTail = this.queueTail
      .then(() => this.runAnalysis(gameId))
      .catch((error) => {
        console.error('[game-analysis] queue task failed:', error);
      })
      .finally(() => {
        this.runningGameIds.delete(gameId);
      });
  }

  private async runAnalysis(gameId: string): Promise<void> {
    try {
      const game = await Game.findOne({ roomId: gameId }).lean();
      if (!game) {
        throw new Error('Game not found');
      }

      const moveHistory = Array.isArray(game.moveHistory) ? game.moveHistory as AnalysisMoveData[] : [];
      if (moveHistory.length === 0) {
        throw new Error('Game has no moves to analyze');
      }

      const result = await this.analyzeMoves({
        initialFEN: game.initialFEN,
        moveHistory,
        gameId,
      });

      const saved = await GameAnalysis.findOneAndUpdate(
        { gameId },
        {
          $set: {
            status: 'done',
            analysisVersion: ANALYSIS_VERSION,
            progressCurrent: moveHistory.length,
            progressTotal: moveHistory.length,
            finishedAt: new Date(),
            result,
          },
          $unset: { error: '' },
        },
        { new: true },
      ).lean();

      this.publish(gameId, 'done', { analysis: saved });
      this.closeSubscribers(gameId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const saved = await GameAnalysis.findOneAndUpdate(
        { gameId },
        {
          $set: {
            status: 'failed',
            error: message,
            finishedAt: new Date(),
          },
        },
        { new: true },
      ).lean();

      this.publish(gameId, 'failed', { error: message, analysis: saved });
      this.closeSubscribers(gameId);
    }
  }

  private async analyzeMoves(input: {
    gameId: string;
    initialFEN: string;
    moveHistory: AnalysisMoveData[];
  }): Promise<GameAnalysisResult> {
    const evalCache = new Map<string, EngineEvaluation>();
    const counters = {
      white: emptySideSummary(),
      black: emptySideSummary(),
    };
    const lossByColor = {
      white: [] as number[],
      black: [] as number[],
    };
    const moves: GameAnalysisResult['moves'] = [];
    const graph: GameAnalysisResult['graph'] = [];

    await this.updateProgress(input.gameId, 0, input.moveHistory.length);
    const initialEval = await this.evaluateWithCache(input.initialFEN, evalCache);

    graph.push({
      ply: 0,
      moveNumber: 0,
      score: scoreCpToPawns(initialEval.scoreCp),
    });

    for (let index = 0; index < input.moveHistory.length; index += 1) {
      const move = input.moveHistory[index]!;
      const ply = index + 1;
      const moveNumber = Math.ceil(ply / 2);
      const fenBefore = index === 0 ? input.initialFEN : input.moveHistory[index - 1]!.FEN;
      const fenAfter = move.FEN;

      const beforeEval = await this.evaluateWithCache(fenBefore, evalCache);
      const afterEval = await this.evaluateWithCache(fenAfter, evalCache);
      const lossCp = getMoveLossCp(beforeEval.scoreCp, afterEval.scoreCp, move.figure.color);
      const quality = classifyMove(lossCp);
      const bestMove = buildBestMove(beforeEval.bestMove, fenBefore);
      const nextBestMove = buildBestMove(afterEval.bestMove, fenAfter);
      lossByColor[move.figure.color].push(lossCp);

      if (quality !== 'normal') {
        counters[move.figure.color][quality] += 1;
      }

      moves.push({
        ply,
        moveNumber,
        color: move.figure.color,
        from: move.from,
        to: move.to,
        notation: getReadableAnalysisNotation(move, fenBefore),
        quality,
        beforeScore: scoreCpToPawns(beforeEval.scoreCp),
        afterScore: scoreCpToPawns(afterEval.scoreCp),
        lossCp,
        fenBefore,
        fenAfter,
        bestMove,
        nextBestMove,
      });

      graph.push({
        ply,
        moveNumber,
        score: scoreCpToPawns(afterEval.scoreCp),
        quality,
      });

      await this.updateProgress(input.gameId, ply, input.moveHistory.length);
    }

    const whiteAccuracy = calculateQualityBasedAccuracy(lossByColor.white, input.moveHistory.length);
    const blackAccuracy = calculateQualityBasedAccuracy(lossByColor.black, input.moveHistory.length);
    counters.white.accuracy = whiteAccuracy.accuracy;
    counters.white.averageLossCp = whiteAccuracy.averageLossCp;
    counters.black.accuracy = blackAccuracy.accuracy;
    counters.black.averageLossCp = blackAccuracy.averageLossCp;

    return {
      initialFEN: input.initialFEN,
      graph,
      counters,
      moves,
      summary: buildSummary(moves),
    };
  }

  private async evaluateWithCache(fen: string, cache: Map<string, EngineEvaluation>): Promise<EngineEvaluation> {
    const cached = cache.get(fen);
    if (cached) {
      return cached;
    }

    const evaluation = await this.engine.evaluateFen({
      fen,
      moveTimeMs: DEFAULT_ANALYSIS_MOVE_TIME_MS,
    });
    cache.set(fen, evaluation);
    return evaluation;
  }

  private async updateProgress(gameId: string, current: number, total: number): Promise<void> {
    await GameAnalysis.updateOne(
      { gameId },
      {
        $set: {
          progressCurrent: current,
          progressTotal: total,
        },
      },
    );

    this.publish(gameId, 'progress', {
      current,
      total,
    });
  }

  private async sendSnapshot(gameId: string, subscriber: Subscriber): Promise<void> {
    const analysis = await GameAnalysis.findOne({ gameId }).lean();
    if (!analysis) {
      return;
    }

    subscriber.send('snapshot', { analysis });
  }

  private publish(gameId: string, event: string, data: unknown): void {
    const subscribers = this.subscribers.get(gameId);
    if (!subscribers) {
      return;
    }

    for (const subscriber of subscribers) {
      subscriber.send(event, data);
    }
  }

  private closeSubscribers(gameId: string): void {
    const subscribers = this.subscribers.get(gameId);
    if (!subscribers) {
      return;
    }

    for (const subscriber of subscribers) {
      subscriber.close();
    }

    this.subscribers.delete(gameId);
  }

  private isStale(startedAt?: Date): boolean {
    if (!startedAt) {
      return true;
    }

    return Date.now() - new Date(startedAt).getTime() > STALE_RUNNING_MS;
  }
}

function buildBestMove(bestMoveUci: string | undefined, fenBefore: string) {
  if (!bestMoveUci) {
    return undefined;
  }

  const coords = uciToCoords(bestMoveUci);
  if (!coords) {
    return undefined;
  }

  return {
    uci: bestMoveUci,
    notation: getReadableUciNotation(bestMoveUci, fenBefore),
    from: coords.from,
    to: coords.to,
  };
}

function buildSummary(moves: GameAnalysisResult['moves']): GameAnalysisResult['summary'] {
  const keyMove = [...moves]
    .filter((move) => move.quality === 'blunder' || move.quality === 'bad')
    .sort((a, b) => b.lossCp - a.lossCp)[0];

  if (!keyMove) {
    return {
      text: 'Партия прошла ровно: явных зевков и серьезных ошибок не найдено.',
    };
  }

  const side = keyMove.color === 'white' ? 'белых' : 'черных';
  const label = keyMove.quality === 'blunder' ? 'Главный зевок' : 'Ключевая ошибка';

  return {
    text: `${label}: ${formatMovePrefix(keyMove.moveNumber, keyMove.color)} ${keyMove.notation} у ${side}.`,
    keyMomentPly: keyMove.ply,
  };
}

function formatMovePrefix(moveNumber: number, color: 'white' | 'black'): string {
  return color === 'white' ? `${moveNumber}.` : `${moveNumber}...`;
}

export const gameAnalysisService = new GameAnalysisService(
  new AnalysisEngine({
    stockfishPath: process.env.STOCKFISH_PATH || 'stockfish',
  }),
);
