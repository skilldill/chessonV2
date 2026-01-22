import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistrationAttempt extends Document {
  ip: string;
  lastRegistrationDate: Date;
  createdAt: Date;
}

const RegistrationAttemptSchema = new Schema<IRegistrationAttempt>(
  {
    ip: {
      type: String,
      required: true,
      index: true
    },
    lastRegistrationDate: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Индекс для быстрого поиска по IP
RegistrationAttemptSchema.index({ ip: 1, lastRegistrationDate: 1 });

export const RegistrationAttempt = mongoose.model<IRegistrationAttempt>(
  'RegistrationAttempt',
  RegistrationAttemptSchema
);
