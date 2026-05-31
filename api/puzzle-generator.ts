import mongoose from 'mongoose';
import { connectDB } from './config/database';
import { ChessBotService } from './src/modules/chess-bot/chess-bot.service';
import { AnalysisEngine } from './src/modules/game-analysis/analysis-engine';
import {
  getPuzzleGeneratorOptionsFromEnv,
  PuzzleGeneratorService,
} from './src/modules/puzzle-generator/puzzle-generator.service';

async function main(): Promise<void> {
  await connectDB();

  const options = getPuzzleGeneratorOptionsFromEnv();
  const generator = new PuzzleGeneratorService(
    new AnalysisEngine({
      stockfishPath: process.env.STOCKFISH_PATH || 'stockfish',
    }),
    new ChessBotService(),
    options,
  );

  console.log('[puzzle-generator] starting', options);

  await generator.start();

  try {
    const stats = await generator.runOnce();
    console.log('[puzzle-generator] finished', stats);
  } finally {
    await generator.stop();
    await mongoose.disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('[puzzle-generator] failed:', error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
