import mongoose, { Schema, Document } from 'mongoose';

export type PuzzleGenerationJobStatus = 'running' | 'done' | 'failed' | 'skipped';

export interface IPuzzleGenerationJob extends Document {
  gameId: string;
  status: PuzzleGenerationJobStatus;
  attempts: number;
  createdCount: number;
  skippedReason?: string;
  error?: string;
  startedAt: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PuzzleGenerationJobSchema = new Schema<IPuzzleGenerationJob>(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['running', 'done', 'failed', 'skipped'],
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
    },
    createdCount: {
      type: Number,
      required: true,
      default: 0,
    },
    skippedReason: String,
    error: String,
    startedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    finishedAt: Date,
  },
  {
    timestamps: true,
  },
);

PuzzleGenerationJobSchema.index({ status: 1, updatedAt: -1 });

export const PuzzleGenerationJob = mongoose.model<IPuzzleGenerationJob>('PuzzleGenerationJob', PuzzleGenerationJobSchema);
