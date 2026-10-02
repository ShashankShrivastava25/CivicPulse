import { Schema, model } from 'mongoose';

const voteSchema = new Schema({
  issue: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
voteSchema.index({ issue: 1, user: 1 }, { unique: true });

export const Vote = model('Vote', voteSchema);
