import { Game } from '../../../models/Game';
import { Puzzle, type IPuzzleMoveData, type PuzzleSide, type PuzzleStatus } from '../../../models/Puzzle';
import { PuzzleGenerationJob } from '../../../models/PuzzleGenerationJob';
import { ChessBotService } from '../chess-bot/chess-bot.service';
import { AnalysisEngine } from '../game-analysis/analysis-engine';
import type { AnalysisMoveData, EngineTopMove } from '../game-analysis/types';
import { isPuzzleSolutionPlayable } from './puzzle-validator';

export type PuzzleGeneratorOptions = {
  limit: number;
  moveTimeMs: number;
  multiPv: number;
  skipOpeningPlies: number;
  minMoveHistoryLength: number;
  minFirstMoveGapCp: number;
  minContinuationGapCp: number;
  minFirstMoveAdvantageCp: number;
  maxSolutionPlies: number;
  maxPuzzlesPerGame: number;
  staleRunningJobMs: number;
  status: PuzzleStatus;
};

type PuzzleGeneratorStats = {
  gamesScanned: number;
  gamesProcessed: number;
  gamesSkipped: number;
  gamesFailed: number;
  puzzlesCreated: number;
};

type CandidatePosition = {
  sourcePly: number;
  fen: string;
  sideToMove: PuzzleSide;
  topMoves: EngineTopMove[];
};

export type BuiltPuzzle = {
  initialFEN: string;
  sideToMove: PuzzleSide;
  sourcePly: number;
  solution: IPuzzleMoveData[];
  topMoves: EngineTopMove[];
};

const DEFAULT_OPTIONS: PuzzleGeneratorOptions = {
  limit: 50,
  moveTimeMs: 150,
  multiPv: 3,
  skipOpeningPlies: 12,
  minMoveHistoryLength: 20,
  minFirstMoveGapCp: 150,
  minContinuationGapCp: 60,
  minFirstMoveAdvantageCp: 120,
  maxSolutionPlies: 5,
  maxPuzzlesPerGame: 1,
  staleRunningJobMs: 30 * 60 * 1000,
  status: 'draft',
};

export class PuzzleGeneratorService {
  constructor(
    private readonly engine: AnalysisEngine,
    private readonly chessBot: ChessBotService,
    private readonly options: Partial<PuzzleGeneratorOptions> = {},
  ) {}

  async start(): Promise<void> {
    await Promise.all([
      this.engine.start(),
      this.chessBot.start(),
    ]);
  }

  async stop(): Promise<void> {
    await Promise.allSettled([
      this.engine.stop(),
      this.chessBot.stop(),
    ]);
  }

  async runOnce(): Promise<PuzzleGeneratorStats> {
    const options = this.getOptions();
    const runningJobCutoff = new Date(Date.now() - options.staleRunningJobMs);
    const processedGameIds = await PuzzleGenerationJob
      .find({
        $or: [
          { status: { $in: ['done', 'skipped'] } },
          { status: 'running', updatedAt: { $gt: runningJobCutoff } },
        ],
      })
      .distinct('gameId');

    const games = await Game
      .find({
        roomId: { $nin: processedGameIds },
        [`moveHistory.${options.minMoveHistoryLength - 1}`]: { $exists: true },
      })
      .sort({ endedAt: -1 })
      .limit(options.limit)
      .lean();

    const stats: PuzzleGeneratorStats = {
      gamesScanned: games.length,
      gamesProcessed: 0,
      gamesSkipped: 0,
      gamesFailed: 0,
      puzzlesCreated: 0,
    };

    for (const game of games) {
      const gameId = game.roomId;
      await PuzzleGenerationJob.findOneAndUpdate(
        { gameId },
        {
          $set: {
            status: 'running',
            startedAt: new Date(),
            finishedAt: undefined,
            error: undefined,
            skippedReason: undefined,
            createdCount: 0,
          },
          $inc: { attempts: 1 },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );

      try {
        const moveHistory = Array.isArray(game.moveHistory) ? game.moveHistory as AnalysisMoveData[] : [];
        const builtPuzzles = await this.generateFromGame({
          gameId,
          initialFEN: game.initialFEN,
          moveHistory,
          options,
        });

        let createdCount = 0;
        for (const builtPuzzle of builtPuzzles) {
          const bestMove = builtPuzzle.topMoves[0]!;
          const secondMove = builtPuzzle.topMoves[1];

          const result = await Puzzle.updateOne(
            {
              sourceGameId: gameId,
              sourcePly: builtPuzzle.sourcePly,
            },
            {
              $setOnInsert: {
                sourceGameId: gameId,
                sourcePly: builtPuzzle.sourcePly,
                initialFEN: builtPuzzle.initialFEN,
                sideToMove: builtPuzzle.sideToMove,
                solution: builtPuzzle.solution,
                difficulty: classifyDifficulty(builtPuzzle.solution.length, bestMove, secondMove, builtPuzzle.sideToMove),
                themes: inferThemes(bestMove),
                status: options.status,
                engineMeta: {
                  name: 'stockfish',
                  depth: bestMove.depth,
                  moveTimeMs: options.moveTimeMs,
                  multiPv: options.multiPv,
                  bestMoveScoreCp: bestMove.scoreCp,
                  secondMoveScoreCp: secondMove?.scoreCp,
                },
              },
            },
            { upsert: true },
          );

          if (result.upsertedCount > 0) {
            createdCount += 1;
          }
        }

        await PuzzleGenerationJob.updateOne(
          { gameId },
          {
            $set: {
              status: createdCount > 0 ? 'done' : 'skipped',
              createdCount,
              skippedReason: createdCount > 0 ? undefined : 'No puzzle candidate passed validation',
              finishedAt: new Date(),
            },
            $unset: { error: '' },
          },
        );

        stats.gamesProcessed += 1;
        if (createdCount === 0) {
          stats.gamesSkipped += 1;
        }
        stats.puzzlesCreated += createdCount;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await PuzzleGenerationJob.updateOne(
          { gameId },
          {
            $set: {
              status: 'failed',
              error: message,
              finishedAt: new Date(),
            },
          },
        );
        stats.gamesFailed += 1;
        console.error(`[puzzle-generator] failed game ${gameId}:`, message);
      }
    }

    return stats;
  }

  async generateFromFen(input: {
    fen: string;
    sourcePly?: number;
    options?: Partial<PuzzleGeneratorOptions>;
  }): Promise<BuiltPuzzle | null> {
    const options = {
      ...this.getOptions(),
      ...input.options,
    };

    const topMoves = await this.engine.evaluateFenTopMoves({
      fen: input.fen,
      moveTimeMs: options.moveTimeMs,
      multiPv: options.multiPv,
    });

    if (!isStrongCandidate(input.fen, topMoves, options)) {
      return null;
    }

    const solution = await this.buildSolutionLine(input.fen, options);
    if (solution.length < 3 || !isPuzzleSolutionPlayable(input.fen, solution)) {
      return null;
    }

    return {
      initialFEN: input.fen,
      sideToMove: getSideToMove(input.fen),
      sourcePly: input.sourcePly ?? 0,
      solution,
      topMoves,
    };
  }

  private async generateFromGame(input: {
    gameId: string;
    initialFEN: string;
    moveHistory: AnalysisMoveData[];
    options: PuzzleGeneratorOptions;
  }): Promise<BuiltPuzzle[]> {
    const candidates: CandidatePosition[] = [];

    for (let index = input.options.skipOpeningPlies; index < input.moveHistory.length; index += 1) {
      const fen = input.moveHistory[index]?.FEN;
      if (!fen || await Puzzle.exists({ sourceGameId: input.gameId, sourcePly: index + 1 })) {
        continue;
      }

      const topMoves = await this.engine.evaluateFenTopMoves({
        fen,
        moveTimeMs: input.options.moveTimeMs,
        multiPv: input.options.multiPv,
      });

      if (!isStrongCandidate(fen, topMoves, input.options)) {
        continue;
      }

      candidates.push({
        sourcePly: index + 1,
        fen,
        sideToMove: getSideToMove(fen),
        topMoves,
      });
    }

    candidates.sort((a, b) => getCandidateScore(b) - getCandidateScore(a));

    const puzzles: BuiltPuzzle[] = [];
    for (const candidate of candidates) {
      if (puzzles.length >= input.options.maxPuzzlesPerGame) {
        break;
      }

      const solution = await this.buildSolutionLine(candidate.fen, input.options);
      if (solution.length < 3) {
        continue;
      }

      if (!isPuzzleSolutionPlayable(candidate.fen, solution)) {
        continue;
      }

      puzzles.push({
        initialFEN: candidate.fen,
        sideToMove: candidate.sideToMove,
        sourcePly: candidate.sourcePly,
        solution,
        topMoves: candidate.topMoves,
      });
    }

    return puzzles;
  }

  private async buildSolutionLine(fen: string, options: PuzzleGeneratorOptions): Promise<IPuzzleMoveData[]> {
    const solution: IPuzzleMoveData[] = [];
    let currentFen = fen;

    for (let ply = 0; ply < options.maxSolutionPlies; ply += 1) {
      const topMoves = await this.engine.evaluateFenTopMoves({
        fen: currentFen,
        moveTimeMs: options.moveTimeMs,
        multiPv: options.multiPv,
      });
      const bestMove = topMoves[0];

      if (!bestMove?.uci || bestMove.uci === '(none)') {
        break;
      }

      if (ply % 2 === 0 && !hasEnoughGap(currentFen, topMoves, ply === 0 ? options.minFirstMoveGapCp : options.minContinuationGapCp)) {
        break;
      }

      const nextFen = await this.chessBot.getFenAfterUciMove({
        fen: currentFen,
        uci: bestMove.uci,
      });
      const moveData = this.chessBot.toRoomMoveData({
        uci: bestMove.uci,
        previousFen: currentFen,
        nextFen,
      });

      solution.push(moveData);
      currentFen = nextFen;

      if (bestMove.mateIn !== undefined && Math.abs(bestMove.mateIn) <= 1) {
        break;
      }
    }

    return solution;
  }

  private getOptions(): PuzzleGeneratorOptions {
    return {
      ...DEFAULT_OPTIONS,
      ...this.options,
    };
  }
}

function isStrongCandidate(fen: string, topMoves: EngineTopMove[], options: PuzzleGeneratorOptions): boolean {
  const bestMove = topMoves[0];
  if (!bestMove?.uci || topMoves.length < 2) {
    return false;
  }

  const sideToMove = getSideToMove(fen);
  const bestAdvantage = getScoreForSide(bestMove.scoreCp, sideToMove);

  return bestMove.mateIn !== undefined
    || (
      bestAdvantage >= options.minFirstMoveAdvantageCp &&
      hasEnoughGap(fen, topMoves, options.minFirstMoveGapCp)
    );
}

function hasEnoughGap(fen: string, topMoves: EngineTopMove[], minGapCp: number): boolean {
  const bestMove = topMoves[0];
  const secondMove = topMoves[1];
  if (!bestMove || !secondMove) {
    return false;
  }

  if (bestMove.mateIn !== undefined && secondMove.mateIn === undefined) {
    return true;
  }

  const sideToMove = getSideToMove(fen);
  const bestAdvantage = getScoreForSide(bestMove.scoreCp, sideToMove);
  const secondAdvantage = getScoreForSide(secondMove.scoreCp, sideToMove);

  return bestAdvantage - secondAdvantage >= minGapCp;
}

function getCandidateScore(candidate: CandidatePosition): number {
  const bestMove = candidate.topMoves[0]!;
  const secondMove = candidate.topMoves[1];
  const bestAdvantage = getScoreForSide(bestMove.scoreCp, candidate.sideToMove);
  const secondAdvantage = secondMove ? getScoreForSide(secondMove.scoreCp, candidate.sideToMove) : 0;
  const mateBonus = bestMove.mateIn === undefined ? 0 : 10_000 - Math.abs(bestMove.mateIn);

  return mateBonus + bestAdvantage + Math.max(0, bestAdvantage - secondAdvantage);
}

export function classifyDifficulty(solutionLength: number, bestMove: EngineTopMove, secondMove: EngineTopMove | undefined, side: PuzzleSide) {
  const bestAdvantage = getScoreForSide(bestMove.scoreCp, side);
  const secondAdvantage = secondMove ? getScoreForSide(secondMove.scoreCp, side) : bestAdvantage;
  const gap = bestAdvantage - secondAdvantage;

  if (bestMove.mateIn !== undefined && Math.abs(bestMove.mateIn) <= 2) {
    return 'easy';
  }
  if (solutionLength >= 5 || gap < 220) {
    return 'hard';
  }
  return 'medium';
}

export function inferThemes(bestMove: EngineTopMove): string[] {
  if (bestMove.mateIn !== undefined) {
    return ['mate'];
  }

  return ['tactic'];
}

function getScoreForSide(scoreCp: number, side: PuzzleSide): number {
  return side === 'white' ? scoreCp : -scoreCp;
}

function getSideToMove(fen: string): PuzzleSide {
  return fen.split(/\s+/)[1] === 'b' ? 'black' : 'white';
}

export function getPuzzleGeneratorOptionsFromEnv(): PuzzleGeneratorOptions {
  return {
    limit: readIntEnv('PUZZLE_GENERATOR_LIMIT', DEFAULT_OPTIONS.limit),
    moveTimeMs: readIntEnv('PUZZLE_GENERATOR_MOVE_TIME_MS', DEFAULT_OPTIONS.moveTimeMs),
    multiPv: readIntEnv('PUZZLE_GENERATOR_MULTIPV', DEFAULT_OPTIONS.multiPv),
    skipOpeningPlies: readIntEnv('PUZZLE_GENERATOR_SKIP_OPENING_PLIES', DEFAULT_OPTIONS.skipOpeningPlies),
    minMoveHistoryLength: readIntEnv('PUZZLE_GENERATOR_MIN_MOVES', DEFAULT_OPTIONS.minMoveHistoryLength),
    minFirstMoveGapCp: readIntEnv('PUZZLE_GENERATOR_MIN_FIRST_GAP_CP', DEFAULT_OPTIONS.minFirstMoveGapCp),
    minContinuationGapCp: readIntEnv('PUZZLE_GENERATOR_MIN_CONTINUATION_GAP_CP', DEFAULT_OPTIONS.minContinuationGapCp),
    minFirstMoveAdvantageCp: readIntEnv('PUZZLE_GENERATOR_MIN_ADVANTAGE_CP', DEFAULT_OPTIONS.minFirstMoveAdvantageCp),
    maxSolutionPlies: readIntEnv('PUZZLE_GENERATOR_MAX_SOLUTION_PLIES', DEFAULT_OPTIONS.maxSolutionPlies),
    maxPuzzlesPerGame: readIntEnv('PUZZLE_GENERATOR_MAX_PUZZLES_PER_GAME', DEFAULT_OPTIONS.maxPuzzlesPerGame),
    staleRunningJobMs: readIntEnv('PUZZLE_GENERATOR_STALE_RUNNING_JOB_MS', DEFAULT_OPTIONS.staleRunningJobMs),
    status: process.env.PUZZLE_GENERATOR_STATUS === 'published' ? 'published' : 'draft',
  };
}

function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
