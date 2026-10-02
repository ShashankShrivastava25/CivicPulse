import { NextFunction, Request, Response } from 'express';
import { User, Role } from '../models';
import { AppError } from '../utils/AppError';
import { COOKIE_NAME, verifyToken } from '../utils/token';
import { asyncHandler } from '../utils/asyncHandler';

/** Role and identity come ONLY from the verified token + database, never from the request body. */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined;
  const token = req.cookies?.[COOKIE_NAME] ?? bearer;
  if (!token) throw new AppError(401, 'Please sign in to continue');

  let sub: string;
  try { sub = verifyToken(token).sub; } catch { throw new AppError(401, 'Your session has expired. Please sign in again'); }

  const user = await User.findById(sub).select('role accountStatus');
  if (!user) throw new AppError(401, 'Account not found');
  if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'REJECTED')
    throw new AppError(403, 'This account is not allowed to sign in');

  req.user = { id: user.id, role: user.role as Role, accountStatus: user.accountStatus };
  next();
});

export const requireRole = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError(401, 'Please sign in to continue'));
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'You do not have access to this resource'));
  next();
};

/** Alias kept for routes written against an earlier name. Identical to requireAuth. */
export const authenticate = requireAuth;

/**
 * A public servant may only use public-servant functionality once an admin has approved them.
 * PENDING / REJECTED / SUSPENDED public servants are blocked here, server-side — the frontend
 * banner is a courtesy, not the enforcement point.
 */
export const requireApprovedServant = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError(401, 'Please sign in to continue'));
  if (req.user.role !== 'PUBLIC_SERVANT') return next(new AppError(403, 'You do not have access to this resource'));
  if (req.user.accountStatus !== 'APPROVED') {
    return next(new AppError(403, 'Your public servant account is not yet approved by an administrator'));
  }
  next();
});
