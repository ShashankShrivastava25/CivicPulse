import { Router } from 'express';
import { notificationController as c } from '../controllers/notificationController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', c.list);
router.patch('/:id/read', c.markRead);
router.patch('/read-all', c.markAllRead);

export default router;
