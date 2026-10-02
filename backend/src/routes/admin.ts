import { Router } from 'express';
import { adminController as c } from '../controllers/adminController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/users', c.listUsers);
router.patch('/users/:id/suspend', c.suspendUser);
router.patch('/users/:id/reactivate', c.reactivateUser);

router.get('/public-servants', c.listServants);
router.patch('/public-servants/:id/approve', c.approveServant);
router.patch('/public-servants/:id/reject', c.rejectServant);
router.patch('/public-servants/:id/suspend', c.suspendServant);
router.patch('/public-servants/:id/reactivate', c.reactivateServant);

router.get('/issues', c.listIssues);
router.get('/issues/:id', c.getIssue);
router.get('/issues/:id/duplicates', c.getDuplicateCandidates);
router.patch('/issues/:id/assign', c.assignIssue);
router.patch('/issues/:id/status', c.changeStatus);
router.patch('/issues/:id/priority', c.changePriority);
router.patch('/issues/:id/moderate', c.moderateIssue);

router.get('/municipalities', c.listMunicipalities);
router.post('/municipalities', c.createMunicipality);
router.patch('/municipalities/:id', c.updateMunicipality);
router.patch('/municipalities/:id/deactivate', c.deactivateMunicipality);

router.get('/departments', c.listDepartments);
router.post('/departments', c.createDepartment);
router.patch('/departments/:id', c.updateDepartment);
router.patch('/departments/:id/deactivate', c.deactivateDepartment);

router.get('/ai-configuration', c.getAiConfiguration);
router.patch('/ai-configuration', c.updateAiConfiguration);
router.patch('/priority-configuration', c.updatePriorityConfiguration);
router.get('/duplicate-analytics', c.duplicateAnalytics);

router.get('/analytics', c.analytics);
router.get('/audit-logs', c.auditLogs);

export default router;
