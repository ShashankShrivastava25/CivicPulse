import { Schema, model } from 'mongoose';

/** Append-only. Never store passwords, tokens or API keys in `metadata` (AuditService redacts them). */
const auditLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  actorRole: String,
  action: { type: String, required: true, index: true },
  targetType: { type: String, index: true },
  targetId: String,
  metadata: Schema.Types.Mixed,
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });
auditLogSchema.index({ timestamp: -1 });

export const AuditLog = model('AuditLog', auditLogSchema);
