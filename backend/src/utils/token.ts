import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env, isProd } from '../config/env';

export const COOKIE_NAME = 'cp_token';
const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};

export const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const verifyToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as { sub: string };

export const setAuthCookie = (res: Response, token: string) =>
  res.cookie(COOKIE_NAME, token, { ...cookieOpts, maxAge: 7 * 24 * 3600 * 1000 });

export const clearAuthCookie = (res: Response) => res.clearCookie(COOKIE_NAME, cookieOpts);

export const randomToken = () => crypto.randomBytes(32).toString('hex');
export const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
