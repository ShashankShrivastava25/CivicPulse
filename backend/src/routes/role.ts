import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';

// Role-gated probe routes: they prove requireRole works and are where later phases mount real routes.
const r = Router();
r.get('/citizen/ping', requireAuth, requireRole('CITIZEN'), (_q, s) => s.json({ success: true, data: 'citizen ok' }));
r.get('/public-servant/ping', requireAuth, requireRole('PUBLIC_SERVANT'), (_q, s) => s.json({ success: true, data: 'public servant ok' }));
r.get('/admin/ping', requireAuth, requireRole('ADMIN'), (_q, s) => s.json({ success: true, data: 'admin ok' }));
export default r;
