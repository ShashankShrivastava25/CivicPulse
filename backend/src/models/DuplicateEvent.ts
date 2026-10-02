import { Schema, model } from 'mongoose';

/**
 * Tracks the duplicate-detection funnel so analytics can separate what the AI SUGGESTED from what a citizen CONFIRMED.
 *  SUGGESTED -> the system showed the citizen a possible duplicate (AI/heuristic suggestion only)
 *  CONFIRMED -> the citizen said "yes, same issue" and supported the existing report instead of filing a new one
 *  REJECTED  -> the citizen said "no, different issue" and filed a new report anyway
 */
const duplicateEventSchema = new Schema({
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  suggestedIssue: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
  newIssue: { type: Schema.Types.ObjectId, ref: 'Issue' },
  outcome: { type: String, enum: ['SUGGESTED', 'CONFIRMED', 'REJECTED'], required: true, index: true },
  confidence: Number,
}, { timestamps: true });

export const DuplicateEvent = model('DuplicateEvent', duplicateEventSchema);
