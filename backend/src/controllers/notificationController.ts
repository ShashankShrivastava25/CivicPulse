import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export const notificationController = {
  /** GET /api/notifications */
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const filter: Record<string, unknown> = { user: req.user!.id };
    if (req.query.unreadOnly === 'true') filter.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user!.id, read: false }),
    ]);
    res.json({ success: true, data: { notifications, unreadCount, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  }),

  /** PATCH /api/notifications/:id/read */
  markRead: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) return next(new AppError(404, 'Notification not found'));
    res.json({ success: true, data: { notification } });
  }),

  /** PATCH /api/notifications/read-all */
  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await Notification.updateMany({ user: req.user!.id, read: false }, { read: true, readAt: new Date() });
    res.json({ success: true, data: null });
  }),
};
