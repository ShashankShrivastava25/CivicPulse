import { Router } from 'express';
import auth from './auth';
import users from './users';
import role from './role';
import issues from './issues';
import publicServant from './publicServant';
import admin from './admin';
import notifications from './notifications';

const r = Router();
r.get('/health', (_q, s) => s.json({ success: true, data: { status: 'ok', service: 'civicpulse-api', time: new Date().toISOString() } }));
r.use('/auth', auth);
r.use('/users', users);
r.use('/issues', issues);
r.use('/public-servant', publicServant);
r.use('/admin', admin);
r.use('/notifications', notifications);
r.use('/', role);
export default r;
