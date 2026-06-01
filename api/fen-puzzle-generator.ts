import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ChessBotService } from './src/modules/chess-bot/chess-bot.service';
import { AnalysisEngine } from './src/modules/game-analysis/analysis-engine';
import {
  classifyDifficulty,
  getPuzzleGeneratorOptionsFromEnv,
  inferThemes,
  PuzzleGeneratorService,
  type BuiltPuzzle,
  type PuzzleGeneratorOptions,
} from './src/modules/puzzle-generator/puzzle-generator.service';
import type { PuzzleStatus } from './models/Puzzle';

type FenInput = {
  fen: string;
  sourceGameId?: string;
  sourcePly?: number;
};

type GeneratedPuzzle = {
  sourceGameId: string;
  sourcePly: number;
  initialFEN: string;
  sideToMove: BuiltPuzzle['sideToMove'];
  solution: BuiltPuzzle['solution'];
  difficulty: 'easy' | 'medium' | 'hard';
  themes: string[];
  status: PuzzleStatus;
  engineMeta: {
    name: 'stockfish';
    depth?: number;
    moveTimeMs: number;
    multiPv: number;
    bestMoveScoreCp: number;
    secondMoveScoreCp?: number;
  };
  createdAt: string;
};

const DEFAULT_INPUT_FILE = '/app/fen-puzzles/input/fens.txt';
const DEFAULT_OUTPUT_FILE = '/app/fen-puzzles/output/puzzles.json';

async function main(): Promise<void> {
  const inputFile = process.env.FEN_PUZZLE_INPUT_FILE || DEFAULT_INPUT_FILE;
  const outputFile = process.env.FEN_PUZZLE_OUTPUT_FILE || DEFAULT_OUTPUT_FILE;
  const status = process.env.FEN_PUZZLE_STATUS === 'published' ? 'published' : 'draft';
  const limit = readPositiveInt('FEN_PUZZLE_LIMIT', Number.POSITIVE_INFINITY);
  const options = getFenGeneratorOptions();
  const inputs = (await readFenInputs(inputFile)).slice(0, limit);

  const generator = new PuzzleGeneratorService(
    new AnalysisEngine({
      stockfishPath: process.env.STOCKFISH_PATH || 'stockfish',
    }),
    new ChessBotService(),
    options,
  );

  console.log('[fen-puzzle-generator] starting', {
    inputFile,
    outputFile,
    count: inputs.length,
    status,
    options,
  });

  const puzzles: GeneratedPuzzle[] = [];
  await generator.start();

  try {
    for (const [index, input] of inputs.entries()) {
      try {
        const builtPuzzle = await generator.generateFromFen({
          fen: input.fen,
          sourcePly: input.sourcePly ?? 0,
          options,
        });

        if (!builtPuzzle) {
          console.log(`[fen-puzzle-generator] skipped FEN ${index + 1}: no valid puzzle`);
          continue;
        }

        puzzles.push(toGeneratedPuzzle({
          builtPuzzle,
          options,
          sourceGameId: input.sourceGameId || createFenSourceId(input.fen),
          sourcePly: input.sourcePly ?? 0,
          status,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[fen-puzzle-generator] failed FEN ${index + 1}:`, message);
      }
    }
  } finally {
    await generator.stop();
  }

  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(puzzles, null, 2)}\n`, 'utf8');
  console.log('[fen-puzzle-generator] finished', {
    inputCount: inputs.length,
    generatedCount: puzzles.length,
    outputFile,
  });
}

async function readFenInputs(filePath: string): Promise<FenInput[]> {
  const raw = await readFile(filePath, 'utf8');
  if (filePath.endsWith('.json')) {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('FEN JSON input must be an array');
    }

    return parsed.map((item, index) => {
      if (typeof item === 'string') {
        return { fen: normalizeFen(item) };
      }

      if (item && typeof item === 'object' && typeof (item as FenInput).fen === 'string') {
        return {
          fen: normalizeFen((item as FenInput).fen),
          sourceGameId: typeof (item as FenInput).sourceGameId === 'string' ? (item as FenInput).sourceGameId : undefined,
          sourcePly: typeof (item as FenInput).sourcePly === 'number' ? (item as FenInput).sourcePly : 0,
        };
      }

      throw new Error(`Invalid FEN input at index ${index}`);
    }).filter((item) => item.fen.length > 0);
  }

  return raw
    .split(/\r?\n/)
    .map((line) => normalizeFen(line))
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((fen) => ({
      fen,
      sourcePly: 0,
    }));
}

function toGeneratedPuzzle(input: {
  builtPuzzle: BuiltPuzzle;
  options: PuzzleGeneratorOptions;
  sourceGameId: string;
  sourcePly: number;
  status: PuzzleStatus;
}): GeneratedPuzzle {
  const bestMove = input.builtPuzzle.topMoves[0]!;
  const secondMove = input.builtPuzzle.topMoves[1];

  return {
    sourceGameId: input.sourceGameId,
    sourcePly: input.sourcePly,
    initialFEN: input.builtPuzzle.initialFEN,
    sideToMove: input.builtPuzzle.sideToMove,
    solution: input.builtPuzzle.solution,
    difficulty: classifyDifficulty(input.builtPuzzle.solution.length, bestMove, secondMove, input.builtPuzzle.sideToMove),
    themes: inferThemes(bestMove),
    status: input.status,
    engineMeta: {
      name: 'stockfish',
      depth: bestMove.depth,
      moveTimeMs: input.options.moveTimeMs,
      multiPv: input.options.multiPv,
      bestMoveScoreCp: bestMove.scoreCp,
      secondMoveScoreCp: secondMove?.scoreCp,
    },
    createdAt: new Date().toISOString(),
  };
}

function getFenGeneratorOptions(): PuzzleGeneratorOptions {
  const baseOptions = getPuzzleGeneratorOptionsFromEnv();

  return {
    ...baseOptions,
    limit: readPositiveInt('FEN_PUZZLE_LIMIT', baseOptions.limit),
    moveTimeMs: readPositiveInt('FEN_PUZZLE_MOVE_TIME_MS', baseOptions.moveTimeMs),
    multiPv: readPositiveInt('FEN_PUZZLE_MULTIPV', baseOptions.multiPv),
    minFirstMoveGapCp: readPositiveInt('FEN_PUZZLE_MIN_FIRST_GAP_CP', baseOptions.minFirstMoveGapCp),
    minContinuationGapCp: readPositiveInt('FEN_PUZZLE_MIN_CONTINUATION_GAP_CP', baseOptions.minContinuationGapCp),
    minFirstMoveAdvantageCp: readPositiveInt('FEN_PUZZLE_MIN_ADVANTAGE_CP', baseOptions.minFirstMoveAdvantageCp),
    maxSolutionPlies: readPositiveInt('FEN_PUZZLE_MAX_SOLUTION_PLIES', baseOptions.maxSolutionPlies),
  };
}

function createFenSourceId(fen: string): string {
  return `fen:${crypto.createHash('sha1').update(fen).digest('hex').slice(0, 20)}`;
}

function normalizeFen(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('[fen-puzzle-generator] failed:', error);
    process.exit(1);
  });
