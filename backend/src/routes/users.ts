import { Router } from 'express';
import { updateMe, updateMyLanguage } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../validators/auth';

const r = Router();
r.patch('/me', requireAuth, validate(updateProfileSchema), updateMe);
r.patch('/me/language', requireAuth, updateMyLanguage);
export default r;
