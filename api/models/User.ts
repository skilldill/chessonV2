import mongoose, { Schema, Document } from 'mongoose';

export interface IAppearance {
  chessboardTheme?: string;
}

export interface IUser extends Document {
  login: string;
  password: string;
  email: string;
  name?: string;
  avatar?: string;
  appearance?: IAppearance;
  emailVerified: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: Date;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    login: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    name: {
      type: String,
      default: undefined,
      trim: true
    },
    avatar: {
      type: String,
      default: '0'
    },
    appearance: {
      type: Schema.Types.Mixed,
      default: () => ({ chessboardTheme: 'default' })
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true
    },
    blockedReason: {
      type: String,
      default: null
    },
    blockedAt: {
      type: Date,
      default: null
    },
    emailVerificationToken: {
      type: String,
      default: null
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
