import { Schema, model } from 'mongoose';

const tokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: Date,
}, { timestamps: true });

export const PasswordResetToken = model('PasswordResetToken', tokenSchema);
