import { Router } from 'express';
import { issueController } from '../controllers/issueController';
import { authenticate } from '../middleware/auth';
import { reportLimiter } from '../middleware/rateLimit';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Report a new issue
router.post('/report', reportLimiter, issueController.reportIssue);

// Get issue details
router.get('/:id', issueController.getIssue);

// Upvote an issue
router.post('/:id/upvote', issueController.upvoteIssue);

// Remove upvote
router.delete('/:id/upvote', issueController.removeUpvote);

// Get nearby issues
router.get('/nearby/search', issueController.getNearbyIssues);

// Get user's reports
router.get('/my-reports/list', issueController.getUserReports);

// Search issues
router.get('/search/query', issueController.searchIssues);

// Confirm duplicate and upvote existing
router.post('/duplicate/confirm', reportLimiter, issueController.confirmDuplicate);

export default router;
