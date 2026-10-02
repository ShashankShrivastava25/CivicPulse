import { NextFunction, Request, Response } from 'express';
import * as users from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/User';
import { LANGUAGES } from '../validators/auth';
import { AppError } from '../utils/AppError';

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: { user: await users.updateProfile(req.user!.id, req.body) } });
});

const LANG_CODES = LANGUAGES.map((l) => l.code) as string[];

/** Dedicated, low-risk endpoint for the language switcher: changes one field, nothing else can be overwritten by a stale client. */
export const updateMyLanguage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { preferredLanguage } = req.body ?? {};
  if (typeof preferredLanguage !== 'string' || !LANG_CODES.includes(preferredLanguage)) {
    return next(new AppError(400, 'Choose a supported language'));
  }
  const user = await User.findByIdAndUpdate(req.user!.id, { preferredLanguage }, { new: true });
  res.json({ success: true, data: { user } });
});
