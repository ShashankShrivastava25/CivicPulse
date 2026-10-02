import { Router } from 'express';
import { publicServantController as c } from '../controllers/publicServantController';
import { requireAuth, requireApprovedServant } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireApprovedServant);

router.get('/dashboard', c.getDashboard);
router.get('/priority-queue', c.priorityQueue);
router.get('/profile', c.getProfile);
router.get('/issues', c.listIssues);
router.get('/issues/:id', c.getIssue);
router.patch('/issues/:id/status', c.changeStatus);
router.post('/issues/:id/assign', c.assign);
router.post('/issues/:id/accept', c.accept);
router.post('/issues/:id/update', c.addUpdate);
router.post('/issues/:id/resolve', c.resolve);

export default router;
