import { Schema, model } from 'mongoose';

export const NOTIFICATION_TYPES = [
  // citizen
  'REPORT_SUBMITTED', 'DUPLICATE_DETECTED', 'UPVOTE_RECORDED', 'ISSUE_ASSIGNED', 'STATUS_CHANGED', 'ACTION_UPDATE', 'ISSUE_RESOLVED',
  // public servant
  'NEW_ASSIGNMENT', 'HIGH_PRIORITY_ISSUE', 'ISSUE_REASSIGNED', 'ADMIN_UPDATE', 'ACCOUNT_STATUS',
  // admin
  'NEW_SERVANT_REGISTRATION', 'MODERATION_EVENT', 'SYSTEM_EVENT',
] as const;

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: NOTIFICATION_TYPES },
  title: String,
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  readAt: Date,
  issue: { type: Schema.Types.ObjectId, ref: 'Issue' },
  link: String,
}, { timestamps: true });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = model('Notification', notificationSchema);
