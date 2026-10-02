import { Request, Response } from 'express';
import * as auth from '../services/authService';
import { getById } from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/token';
import { isProd } from '../config/env';
import { audit } from '../services/AuditService';
import { notifyAdmins } from '../services/NotificationService';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await auth.register(req.body);
  setAuthCookie(res, signToken(user.id));
  if (user.role === 'PUBLIC_SERVANT') {
    await notifyAdmins({ type: 'NEW_SERVANT_REGISTRATION', title: 'New public servant registration', message: `${user.fullName} registered as a public servant and is awaiting approval.` });
    await audit({ actorId: user.id, actorRole: 'PUBLIC_SERVANT', action: 'SERVANT_REGISTERED', targetType: 'User', targetId: user.id });
  }
  res.status(201).json({ success: true, data: { user } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await auth.login(req.body);
  setAuthCookie(res, signToken(user.id));
  await audit({ actorId: user.id, actorRole: user.role, action: 'LOGIN', targetType: 'User', targetId: user.id });
  res.json({ success: true, data: { user } });
});

export const logout = (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ success: true, data: null });
};

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: { user: await getById(req.user!.id) } });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await auth.createResetToken(req.body.email);
  // Email delivery is not built yet: in development the link is printed to the server console.
  if (result && !isProd) console.log(`[dev] Password reset link for ${req.body.email}: ${result.link}`);
  res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await auth.resetPassword(req.body);
  res.json({ success: true, message: 'Password updated. You can sign in now.' });
});
