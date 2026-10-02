import { Notification, User } from '../models';

interface Payload { type: string; title?: string; message: string; issue?: string; link?: string }

/** Best-effort: a failed notification must never fail the action that triggered it. */
export async function notify(userIds: string | string[], p: Payload) {
  const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean).map(String))];
  if (!ids.length) return;
  try {
    await Notification.insertMany(ids.map((user) => ({ user, ...p })));
  } catch (e) {
    console.error('Notification failed:', (e as Error).message);
  }
}

export async function notifyAdmins(p: Payload, exceptUserId?: string) {
  const admins = await User.find({ role: 'ADMIN', accountStatus: 'ACTIVE', ...(exceptUserId ? { _id: { $ne: exceptUserId } } : {}) }).select('_id').lean();
  await notify(admins.map((a) => String(a._id)), p);
}

export class NotificationService {
  static notify = notify;
  static notifyAdmins = notifyAdmins;
}
