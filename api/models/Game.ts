import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  roomId: string;
  whitePlayer?: {
    userId?: mongoose.Types.ObjectId;
    userName: string;
    avatar: string;
  };
  blackPlayer?: {
    userId?: mongoose.Types.ObjectId;
    userName: string;
    avatar: string;
  };
  initialFEN: string;
  finalFEN: string;
  moveHistory: Array<{
    FEN: string;
    from: [number, number];
    to: [number, number];
    figure: {
      color: "white" | "black";
      type: "pawn" | "bishop" | "knight" | "rook" | "queen" | "king";
    };
  }>;
  result: {
    resultType: "mat" | "pat" | "draw" | "resignation";
    winColor?: "white" | "black";
  };
  timer?: {
    whiteTime: number;
    blackTime: number;
    whiteIncrement?: number;
    blackIncrement?: number;
    initialWhiteTime: number;
    initialBlackTime: number;
  };
  startedAt: Date;
  endedAt: Date;
  hasMobilePlayer?: boolean; // Есть ли мобильный игрок в игре
  analysisStatus?: "not_started" | "in_progress" | "done" | "failed";
  analysisRequestedAt?: Date;
  analysisCompletedAt?: Date;
  analysisError?: string;
  analysisVersion?: number;
  analysis?: Array<{
    ply: number;
    fenBefore: string;
    fenAfter: string;
    playedMoveUci: string;
    bestMoveUci: string;
    scoreCp?: number;
    depth?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    whitePlayer: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
      },
      userName: {
        type: String,
        required: true
      },
      avatar: {
        type: String,
        required: true
      }
    },
    blackPlayer: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
      },
      userName: {
        type: String,
        required: true
      },
      avatar: {
        type: String,
        required: true
      }
    },
    initialFEN: {
      type: String,
      required: true
    },
    finalFEN: {
      type: String,
      required: true
    },
    moveHistory: {
      type: [{
        FEN: {
          type: String,
          required: true
        },
        from: {
          type: [Number],
          required: true
        },
        to: {
          type: [Number],
          required: true
        },
        figure: {
          color: {
            type: String,
            enum: ["white", "black"],
            required: true
          },
          type: {
            type: String,
            enum: ["pawn", "bishop", "knight", "rook", "queen", "king"],
            required: true
          }
        }
      }],
      default: []
    },
    result: {
      resultType: {
        type: String,
        enum: ["mat", "pat", "draw", "resignation"],
        required: true
      },
      winColor: {
        type: String,
        enum: ["white", "black"],
        required: false
      }
    },
    timer: {
      whiteTime: Number,
      blackTime: Number,
      whiteIncrement: Number,
      blackIncrement: Number,
      initialWhiteTime: Number,
      initialBlackTime: Number
    },
    startedAt: {
      type: Date,
      required: true
    },
    endedAt: {
      type: Date,
      required: true
    },
    hasMobilePlayer: {
      type: Boolean,
      required: false
    },
    analysisStatus: {
      type: String,
      enum: ["not_started", "in_progress", "done", "failed"],
      default: "not_started",
      index: true,
    },
    analysisRequestedAt: {
      type: Date,
      required: false,
    },
    analysisCompletedAt: {
      type: Date,
      required: false,
    },
    analysisError: {
      type: String,
      required: false,
    },
    analysisVersion: {
      type: Number,
      required: false,
      default: 1,
    },
    analysis: {
      type: [{
        ply: {
          type: Number,
          required: true,
        },
        fenBefore: {
          type: String,
          required: true,
        },
        fenAfter: {
          type: String,
          required: true,
        },
        playedMoveUci: {
          type: String,
          required: true,
        },
        bestMoveUci: {
          type: String,
          required: true,
        },
        scoreCp: {
          type: Number,
          required: false,
        },
        depth: {
          type: Number,
          required: false,
        },
      }],
      default: undefined,
      required: false,
    },
  },
  {
    timestamps: true
  }
);

// Индексы для быстрого поиска
GameSchema.index({ 'whitePlayer.userId': 1 });
GameSchema.index({ 'blackPlayer.userId': 1 });
GameSchema.index({ endedAt: -1 });

export const Game = mongoose.model<IGame>('Game', GameSchema);
