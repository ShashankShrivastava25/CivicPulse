import { Schema, model } from 'mongoose';

/**
 * The issue timeline. One row per event.
 * PUBLIC events are visible to the reporting citizen; INTERNAL events (notes, priority/moderation changes) are staff-only.
 */
export const TIMELINE_KINDS = [
  'REPORTED', 'AI_ANALYSIS', 'ASSIGNED', 'REASSIGNED', 'STATUS_CHANGE', 'ACTION_UPDATE',
  'INTERNAL_NOTE', 'RESOLVED', 'REOPENED', 'PRIORITY_CHANGE', 'MODERATION', 'DUPLICATE',
] as const;

const issueUpdateSchema = new Schema({
  issue: { type: Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
  author: { type: Schema.Types.ObjectId, ref: 'User' }, // absent for system events
  authorRole: { type: String, enum: ['CITIZEN', 'PUBLIC_SERVANT', 'ADMIN', 'SYSTEM'], default: 'SYSTEM' },
  kind: { type: String, enum: TIMELINE_KINDS, default: 'ACTION_UPDATE' },
  visibility: { type: String, enum: ['PUBLIC', 'INTERNAL'], default: 'PUBLIC' },
  status: String,
  message: { type: String, maxlength: 2000 },
  note: String, // legacy field from earlier phases
  imageUrl: String,
  meta: Schema.Types.Mixed,
}, { timestamps: true });
issueUpdateSchema.index({ issue: 1, createdAt: 1 });

export const IssueUpdate = model('IssueUpdate', issueUpdateSchema);
