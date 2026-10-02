import { Router } from 'express';
import * as c from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { forgotPasswordSchema, loginSchema, registerSchemaFor, resetPasswordSchema } from '../validators/auth';

const r = Router();
r.post('/register', authLimiter, validate(registerSchemaFor), c.register);
r.post('/login', authLimiter, validate(loginSchema), c.login);
r.post('/logout', c.logout);
r.get('/me', requireAuth, c.me);
r.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), c.forgotPassword);
r.post('/reset-password', authLimiter, validate(resetPasswordSchema), c.resetPassword);
export default r;
