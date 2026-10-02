import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { isProd } from '../config/env';

export const notFound = (_req: Request, res: Response) =>
  res.status(404).json({ success: false, message: 'Route not found' });

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, message: 'Please fix the highlighted fields', errors: err.flatten().fieldErrors });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, message: err.message, errors: err.errors });
  }
  if ((err as { code?: number })?.code === 11000) {
    return res.status(409).json({ success: false, message: 'An account with these details already exists', errors: { email: ['Already registered'] } });
  }
  if ((err as { type?: string })?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid request body' });
  }
  if (!isProd) console.error(err); else console.error((err as Error)?.message);
  res.status(500).json({ success: false, message: 'Something went wrong on our side. Please try again' });
}
