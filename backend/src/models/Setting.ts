import { Schema, model } from 'mongoose';

/** Key/value admin settings (AI + priority configuration). Secrets (API keys) are NEVER stored here. */
const settingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: Schema.Types.Mixed,
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Setting = model('Setting', settingSchema);
