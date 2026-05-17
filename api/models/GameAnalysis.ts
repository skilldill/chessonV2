import mongoose, { Schema, Document } from 'mongoose';

export type AnalysisStatus = 'running' | 'done' | 'failed';
export type MoveQuality = 'excellent' | 'good' | 'normal' | 'bad' | 'blunder';

export interface IGameAnalysis extends Document {
  gameId: string;
  analysisVersion?: number;
  status: AnalysisStatus;
  progressCurrent: number;
  progressTotal: number;
  startedAt: Date;
  finishedAt?: Date;
  error?: string;
  result?: {
    initialFEN: string;
    graph: Array<{
      ply: number;
      moveNumber: number;
      score: number;
      quality?: MoveQuality;
    }>;
    counters: {
      white: Record<'excellent' | 'good' | 'bad' | 'blunder', number> & { accuracy?: number; averageLossCp?: number };
      black: Record<'excellent' | 'good' | 'bad' | 'blunder', number> & { accuracy?: number; averageLossCp?: number };
    };
    moves: Array<{
      ply: number;
      moveNumber: number;
      color: 'white' | 'black';
      from: [number, number];
      to: [number, number];
      notation: string;
      quality: MoveQuality;
      beforeScore: number;
      afterScore: number;
      lossCp: number;
      fenBefore: string;
      fenAfter: string;
      bestMove?: {
        uci: string;
        notation: string;
        from: [number, number];
        to: [number, number];
      };
      nextBestMove?: {
        uci: string;
        notation: string;
        from: [number, number];
        to: [number, number];
      };
    }>;
    summary: {
      text: string;
      keyMomentPly?: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const CounterSchema = new Schema(
  {
    excellent: { type: Number, required: true, default: 0 },
    good: { type: Number, required: true, default: 0 },
    bad: { type: Number, required: true, default: 0 },
    blunder: { type: Number, required: true, default: 0 },
    accuracy: { type: Number, required: false, default: 100 },
    averageLossCp: { type: Number, required: false, default: 0 },
  },
  { _id: false },
);

const GameAnalysisSchema = new Schema<IGameAnalysis>(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    analysisVersion: {
      type: Number,
      required: false,
      default: 1,
    },
    status: {
      type: String,
      enum: ['running', 'done', 'failed'],
      required: true,
      index: true,
    },
    progressCurrent: {
      type: Number,
      required: true,
      default: 0,
    },
    progressTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    startedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    finishedAt: Date,
    error: String,
    result: {
      initialFEN: String,
      graph: [
        {
          _id: false,
          ply: Number,
          moveNumber: Number,
          score: Number,
          quality: {
            type: String,
            enum: ['excellent', 'good', 'normal', 'bad', 'blunder'],
            required: false,
          },
        },
      ],
      counters: {
        white: CounterSchema,
        black: CounterSchema,
      },
      moves: [
        {
          _id: false,
          ply: Number,
          moveNumber: Number,
          color: {
            type: String,
            enum: ['white', 'black'],
          },
          from: [Number],
          to: [Number],
          notation: String,
          quality: {
            type: String,
            enum: ['excellent', 'good', 'normal', 'bad', 'blunder'],
          },
          beforeScore: Number,
          afterScore: Number,
          lossCp: Number,
          fenBefore: String,
          fenAfter: String,
          bestMove: {
            uci: String,
            notation: String,
            from: [Number],
            to: [Number],
          },
          nextBestMove: {
            uci: String,
            notation: String,
            from: [Number],
            to: [Number],
          },
        },
      ],
      summary: {
        text: String,
        keyMomentPly: Number,
      },
    },
  },
  {
    timestamps: true,
  },
);

export const GameAnalysis = mongoose.model<IGameAnalysis>('GameAnalysis', GameAnalysisSchema);
