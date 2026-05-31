import mongoose, { Schema, Document } from 'mongoose';

export type PuzzleStatus = 'draft' | 'published' | 'rejected';
export type PuzzleSide = 'white' | 'black';
export type PuzzlePieceType = 'pawn' | 'bishop' | 'knight' | 'rook' | 'queen' | 'king';

export interface IPuzzleMoveData {
  FEN: string;
  from: [number, number];
  to: [number, number];
  type?: 'transform';
  figure: {
    color: PuzzleSide;
    type: PuzzlePieceType;
    touched?: boolean;
  };
}

export interface IPuzzle extends Document {
  sourceGameId: string;
  sourcePly: number;
  initialFEN: string;
  sideToMove: PuzzleSide;
  solution: IPuzzleMoveData[];
  difficulty: 'easy' | 'medium' | 'hard';
  themes: string[];
  status: PuzzleStatus;
  likesCount: number;
  dislikesCount: number;
  isBlocked: boolean;
  blockedAt?: Date;
  blockedReason?: string;
  engineMeta: {
    name: string;
    depth?: number;
    moveTimeMs: number;
    multiPv: number;
    bestMoveScoreCp: number;
    secondMoveScoreCp?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PuzzleMoveDataSchema = new Schema<IPuzzleMoveData>(
  {
    FEN: { type: String, required: true },
    from: { type: [Number], required: true },
    to: { type: [Number], required: true },
    type: {
      type: String,
      enum: ['transform'],
      required: false,
    },
    figure: {
      color: {
        type: String,
        enum: ['white', 'black'],
        required: true,
      },
      type: {
        type: String,
        enum: ['pawn', 'bishop', 'knight', 'rook', 'queen', 'king'],
        required: true,
      },
      touched: {
        type: Boolean,
        required: false,
      },
    },
  },
  { _id: false },
);

const PuzzleSchema = new Schema<IPuzzle>(
  {
    sourceGameId: {
      type: String,
      required: true,
      index: true,
    },
    sourcePly: {
      type: Number,
      required: true,
      index: true,
    },
    initialFEN: {
      type: String,
      required: true,
    },
    sideToMove: {
      type: String,
      enum: ['white', 'black'],
      required: true,
    },
    solution: {
      type: [PuzzleMoveDataSchema],
      required: true,
      validate: {
        validator: (moves: IPuzzleMoveData[]) => Array.isArray(moves) && moves.length > 0,
        message: 'Puzzle solution must contain at least one move',
      },
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
      default: 'medium',
    },
    themes: {
      type: [String],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'rejected'],
      required: true,
      default: 'draft',
      index: true,
    },
    likesCount: {
      type: Number,
      required: true,
      default: 0,
    },
    dislikesCount: {
      type: Number,
      required: true,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    blockedAt: Date,
    blockedReason: String,
    engineMeta: {
      name: { type: String, required: true },
      depth: { type: Number, required: false },
      moveTimeMs: { type: Number, required: true },
      multiPv: { type: Number, required: true },
      bestMoveScoreCp: { type: Number, required: true },
      secondMoveScoreCp: { type: Number, required: false },
    },
  },
  {
    timestamps: true,
  },
);

PuzzleSchema.index({ sourceGameId: 1, sourcePly: 1 }, { unique: true });
PuzzleSchema.index({ status: 1, isBlocked: 1, difficulty: 1, createdAt: -1 });

export const Puzzle = mongoose.model<IPuzzle>('Puzzle', PuzzleSchema);
