import mongoose, { Schema, Document } from 'mongoose';
import { TOURNAMENT_MAX_ROUNDS } from '../constants/tournament';

export type TournamentStatus = 'setup' | 'scheduled' | 'running' | 'finished';
export type TournamentNextRoundDelayKind = 'regular' | 'coffeeBreak';
export type TournamentMatchResult = 'playerA' | 'playerB' | 'draw' | 'bye' | 'absent';
export type TournamentMatchStatus = 'pending' | 'active' | 'completed';
export type TournamentRoundStatus = 'active' | 'completed';
export type TournamentRoundKind = 'swiss' | 'tiebreak';

export interface ITournamentParticipant {
  id: string;
  userId?: mongoose.Types.ObjectId;
  nickname: string;
  avatar: string;
  active: boolean;
  removed: boolean;
  connected: boolean;
  joinedAt: Date;
  leftAt?: Date;
}

export interface ITournamentMatch {
  id: string;
  playerAId: string;
  playerBId?: string;
  gameRoomId?: string;
  status: TournamentMatchStatus;
  result?: TournamentMatchResult;
  startedAt?: Date;
  endedAt?: Date;
}

export interface ITournamentRound {
  id: string;
  number: number;
  status: TournamentRoundStatus;
  kind: TournamentRoundKind;
  matches: ITournamentMatch[];
  startedAt: Date;
  endedAt?: Date;
}

export interface ITournament extends Document {
  title: string;
  roundsCount: number;
  timeControl: {
    timeMinutes: number;
    incrementSeconds: number;
  };
  roundDelaySeconds: number;
  coffeeBreak: {
    enabled: boolean;
    afterRound: number;
    durationMinutes: number;
  };
  creatorUserId?: mongoose.Types.ObjectId;
  status: TournamentStatus;
  participants: ITournamentParticipant[];
  rounds: ITournamentRound[];
  currentRoundNumber: number;
  finishAfterCurrentRound: boolean;
  tieBreakDeclined: boolean;
  nextRoundDelayKind?: TournamentNextRoundDelayKind;
  startAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentParticipantSchema = new Schema<ITournamentParticipant>(
  {
    id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    nickname: { type: String, required: true, trim: true },
    avatar: { type: String, required: true, default: '0' },
    active: { type: Boolean, required: true, default: true },
    removed: { type: Boolean, required: true, default: false },
    connected: { type: Boolean, required: true, default: false },
    joinedAt: { type: Date, required: true, default: Date.now },
    leftAt: { type: Date, required: false }
  },
  { _id: false }
);

const TournamentMatchSchema = new Schema<ITournamentMatch>(
  {
    id: { type: String, required: true },
    playerAId: { type: String, required: true },
    playerBId: { type: String, required: false },
    gameRoomId: { type: String, required: false, index: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed'],
      required: true,
      default: 'pending'
    },
    result: {
      type: String,
      enum: ['playerA', 'playerB', 'draw', 'bye', 'absent'],
      required: false
    },
    startedAt: { type: Date, required: false },
    endedAt: { type: Date, required: false }
  },
  { _id: false }
);

const TournamentRoundSchema = new Schema<ITournamentRound>(
  {
    id: { type: String, required: true },
    number: { type: Number, required: true },
    kind: {
      type: String,
      enum: ['swiss', 'tiebreak'],
      required: true,
      default: 'swiss'
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      required: true,
      default: 'active'
    },
    matches: { type: [TournamentMatchSchema], required: true, default: [] },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date, required: false }
  },
  { _id: false }
);

const TournamentSchema = new Schema<ITournament>(
  {
    title: { type: String, required: true, trim: true },
    roundsCount: { type: Number, required: true, min: 1, max: TOURNAMENT_MAX_ROUNDS },
    timeControl: {
      timeMinutes: { type: Number, required: true, default: 10 },
      incrementSeconds: { type: Number, required: true, default: 0 }
    },
    roundDelaySeconds: { type: Number, required: true, default: 15 },
    coffeeBreak: {
      enabled: { type: Boolean, required: true, default: false },
      afterRound: { type: Number, required: true, default: 1 },
      durationMinutes: { type: Number, required: true, default: 5 }
    },
    creatorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    status: {
      type: String,
      enum: ['setup', 'scheduled', 'running', 'finished'],
      required: true,
      default: 'setup',
      index: true
    },
    participants: { type: [TournamentParticipantSchema], required: true, default: [] },
    rounds: { type: [TournamentRoundSchema], required: true, default: [] },
    currentRoundNumber: { type: Number, required: true, default: 0 },
    finishAfterCurrentRound: { type: Boolean, required: true, default: false },
    tieBreakDeclined: { type: Boolean, required: true, default: false },
    nextRoundDelayKind: {
      type: String,
      enum: ['regular', 'coffeeBreak'],
      required: false
    },
    startAt: { type: Date, required: false }
  },
  { timestamps: true }
);

TournamentSchema.index({ 'participants.userId': 1 });
TournamentSchema.index({ 'rounds.matches.gameRoomId': 1 });

export const Tournament = mongoose.model<ITournament>('Tournament', TournamentSchema);
