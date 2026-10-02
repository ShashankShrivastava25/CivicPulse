import { Request, Response, NextFunction } from 'express';
import { Issue, OPEN_STATUSES } from '../models/Issue';
import { Department } from '../models/Department';
import { IssueUpdate } from '../models/IssueUpdate';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { jurisdictionFor, visibilityQuery, assertInJurisdiction } from '../services/JurisdictionService';
import { addTimeline, serializeTimeline } from '../services/TimelineService';
import { notify } from '../services/NotificationService';
import { audit } from '../services/AuditService';
import { StorageService } from '../services/StorageService';
import {
  listIssuesQuery, changeStatusSchema, assignIssueSchema, actionUpdateSchema, resolveIssueSchema,
} from '../validators/staff';

/** Fetches the servant's department (for category fallback) once per request. */
async function deptCategoriesFor(departmentId?: string): Promise<string[]> {
  if (!departmentId) return [];
  const dept = await Department.findById(departmentId).select('categories').lean();
  return dept?.categories ?? [];
}

function summarize(issue: any) {
  return {
    id: issue._id,
    category: issue.category,
    description: (issue.description ?? '').slice(0, 160),
    imageUrl: issue.imageUrl,
    status: issue.status,
    priority: issue.priority,
    priorityScore: issue.priorityScore,
    priorityReasons: issue.priorityReasons,
    upvotes: issue.upvoteCount,
    ward: issue.ward,
    municipalityId: issue.municipalityId,
    departmentId: issue.departmentId,
    assignedTo: issue.assignedTo,
    location: { latitude: issue.latitude, longitude: issue.longitude, address: issue.address },
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };
}

async function buildListQuery(req: Request) {
  const parsed = listIssuesQuery.parse(req.query);
  const j = await jurisdictionFor(req);
  const deptCats = await deptCategoriesFor(j.departmentId);
  const base = visibilityQuery(j, req.user!.id, deptCats);

  const filters: Record<string, unknown> = { moderationStatus: { $ne: 'HIDDEN' } };
  if (parsed.q) filters.$or = [{ description: { $regex: parsed.q, $options: 'i' } }, { category: { $regex: parsed.q, $options: 'i' } }, { address: { $regex: parsed.q, $options: 'i' } }];
  if (parsed.status) filters.status = parsed.status;
  if (parsed.priority) filters.priority = parsed.priority;
  if (parsed.category) filters.category = parsed.category;
  if (parsed.ward) filters.ward = parsed.ward;
  if (parsed.assignedTo) filters.assignedTo = parsed.assignedTo;
  // A servant may further narrow within their own jurisdiction, but never outside it.
  if (parsed.municipalityId && (!j.municipalityId || parsed.municipalityId === j.municipalityId)) filters.municipalityId = parsed.municipalityId;
  if (parsed.departmentId && (!j.departmentId || parsed.departmentId === j.departmentId)) filters.departmentId = parsed.departmentId;
  if (parsed.dateFrom || parsed.dateTo) {
    filters.createdAt = { ...(parsed.dateFrom ? { $gte: parsed.dateFrom } : {}), ...(parsed.dateTo ? { $lte: parsed.dateTo } : {}) };
  }

  const query = { $and: [base, filters] };
  const sort = parsed.sort === 'oldest' ? { createdAt: 1 } : parsed.sort === 'priority' ? { priorityScore: -1, createdAt: -1 } : { createdAt: -1 };
  return { query, sort, page: parsed.page, limit: parsed.limit };
}

export const publicServantController = {
  /** GET /api/public-servant/dashboard — counts scoped to this servant's jurisdiction. */
  getDashboard: asyncHandler(async (req: Request, res: Response) => {
    const j = await jurisdictionFor(req);
    const deptCats = await deptCategoriesFor(j.departmentId);
    const visible = visibilityQuery(j, req.user!.id, deptCats);
    const assignedToMe = { assignedTo: req.user!.id };

    const [totalAssigned, pending, underReview, inProgress, resolved, highPriority] = await Promise.all([
      Issue.countDocuments(assignedToMe),
      Issue.countDocuments({ $and: [visible, { status: 'REPORTED' }] }),
      Issue.countDocuments({ $and: [visible, { status: 'UNDER_REVIEW' }] }),
      Issue.countDocuments({ $and: [assignedToMe, { status: 'IN_PROGRESS' }] }),
      Issue.countDocuments({ $and: [assignedToMe, { status: 'RESOLVED' }] }),
      Issue.countDocuments({ $and: [visible, { priority: { $in: ['HIGH', 'CRITICAL'] }, status: { $in: OPEN_STATUSES } }] }),
    ]);

    res.json({ success: true, data: { stats: { totalAssigned, pending, underReview, inProgress, resolved, highPriority } } });
  }),

  /** GET /api/public-servant/issues — jurisdiction-scoped, searchable, paginated. */
  listIssues: asyncHandler(async (req: Request, res: Response) => {
    const { query, sort, page, limit } = await buildListQuery(req);
    const [issues, total] = await Promise.all([
      Issue.find(query).sort(sort as any).skip((page - 1) * limit).limit(limit).lean(),
      Issue.countDocuments(query),
    ]);
    res.json({ success: true, data: { issues: issues.map(summarize), pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  }),

  /** GET /api/public-servant/priority-queue — jurisdiction-scoped, open issues ordered by priority. */
  priorityQueue: asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const j = await jurisdictionFor(req);
    const deptCats = await deptCategoriesFor(j.departmentId);
    const visible = visibilityQuery(j, req.user!.id, deptCats);
    const query = { $and: [visible, { status: { $in: OPEN_STATUSES }, moderationStatus: { $ne: 'HIDDEN' } }] };
    const issues = await Issue.find(query).sort({ priorityScore: -1, createdAt: 1 }).limit(limit).lean();
    res.json({ success: true, data: { issues: issues.map(summarize) } });
  }),

  /** GET /api/public-servant/issues/:id */
  getIssue: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const issue = await Issue.findById(req.params.id).populate('reporterId', 'fullName email').populate('assignedTo', 'fullName email');
    if (!issue) return next(new AppError(404, 'Issue not found'));
    const j = await jurisdictionFor(req);
    // A servant may look up an unassigned/untriaged issue to review it; assertInJurisdiction only
    // blocks issues that have been triaged into a DIFFERENT department/municipality/ward.
    if (issue.departmentId || issue.municipalityId) assertInJurisdiction(j, issue as any);
    const timeline = (await IssueUpdate.find({ issue: issue._id }).sort({ createdAt: 1 }).populate('author', 'fullName').lean()).map(serializeTimeline);
    res.json({ success: true, data: { issue: { ...summarize(issue), reporter: issue.reporterId, resolutionNotes: issue.resolutionNotes, resolutionEvidenceUrl: issue.resolutionEvidenceUrl, resolutionDate: issue.resolutionDate, timeline } } });
  }),

  /** PATCH /api/public-servant/issues/:id/status */
  changeStatus: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { status, message } = changeStatusSchema.parse(req.body);
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError(404, 'Issue not found'));
    const j = await jurisdictionFor(req);
    assertInJurisdiction(j, issue as any);
    if (status === 'RESOLVED') return next(new AppError(400, 'Use the resolve endpoint to mark an issue resolved'));

    const from = issue.status;
    issue.status = status;
    await issue.save();
    await addTimeline({ issue: String(issue._id), kind: 'STATUS_CHANGE', author: req.user!.id, authorRole: 'PUBLIC_SERVANT', status, message: message ?? `Status changed to ${status.replace('_', ' ')}` });
    await notify(String(issue.reporterId), { type: 'STATUS_CHANGED', message: `Your report is now ${status.replace('_', ' ').toLowerCase()}.`, issue: String(issue._id) });
    await audit({ actorId: req.user!.id, actorRole: 'PUBLIC_SERVANT', action: 'ISSUE_STATUS_CHANGED', targetType: 'Issue', targetId: String(issue._id), metadata: { from, to: status } });

    res.json({ success: true, data: { issue: summarize(issue) } });
  }),

  /** POST /api/public-servant/issues/:id/assign — self-assign or assign a colleague within jurisdiction. */
  assign: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { assignedTo } = assignIssueSchema.parse(req.body);
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError(404, 'Issue not found'));
    const j = await jurisdictionFor(req);
    if (issue.departmentId || issue.municipalityId) assertInJurisdiction(j, issue as any);

    const assignee = await User.findOne({ _id: assignedTo, role: 'PUBLIC_SERVANT', accountStatus: 'APPROVED' }).lean();
    if (!assignee) return next(new AppError(400, 'Choose an approved public servant to assign this to'));

    const wasAssigned = !!issue.assignedTo;
    issue.assignedTo = assignedTo as any;
    issue.assignedAt = new Date();
    if (j.departmentId) issue.departmentId = j.departmentId as any;
    if (j.municipalityId) issue.municipalityId = j.municipalityId as any;
    if (issue.status === 'REPORTED' || issue.status === 'UNDER_REVIEW') issue.status = 'ASSIGNED';
    await issue.save();

    await addTimeline({ issue: String(issue._id), kind: wasAssigned ? 'REASSIGNED' : 'ASSIGNED', author: req.user!.id, authorRole: 'PUBLIC_SERVANT', status: issue.status, message: `Assigned to ${assignee.fullName}` });
    await notify(String(assignedTo), { type: wasAssigned ? 'ISSUE_REASSIGNED' : 'NEW_ASSIGNMENT', message: 'An issue has been assigned to you.', issue: String(issue._id) });
    await notify(String(issue.reporterId), { type: 'ISSUE_ASSIGNED', message: 'Your report has been assigned to a public servant.', issue: String(issue._id) });
    await audit({ actorId: req.user!.id, actorRole: 'PUBLIC_SERVANT', action: wasAssigned ? 'ISSUE_REASSIGNED' : 'ISSUE_ASSIGNED', targetType: 'Issue', targetId: String(issue._id), metadata: { assignedTo } });

    res.json({ success: true, data: { issue: summarize(issue) } });
  }),

  /** POST /api/public-servant/issues/:id/accept — servant accepts an issue routed to their queue. */
  accept: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError(404, 'Issue not found'));
    const j = await jurisdictionFor(req);
    if (issue.departmentId || issue.municipalityId) assertInJurisdiction(j, issue as any);

    issue.assignedTo = req.user!.id as any;
    issue.assignedAt = new Date();
    if (j.departmentId) issue.departmentId = j.departmentId as any;
    if (j.municipalityId) issue.municipalityId = j.municipalityId as any;
    issue.status = 'ASSIGNED';
    await issue.save();

    await addTimeline({ issue: String(issue._id), kind: 'ASSIGNED', author: req.user!.id, authorRole: 'PUBLIC_SERVANT', status: 'ASSIGNED', message: 'Accepted by a public servant' });
    await notify(String(issue.reporterId), { type: 'ISSUE_ASSIGNED', message: 'Your report has been accepted by a public servant.', issue: String(issue._id) });
    await audit({ actorId: req.user!.id, actorRole: 'PUBLIC_SERVANT', action: 'ISSUE_ACCEPTED', targetType: 'Issue', targetId: String(issue._id) });

    res.json({ success: true, data: { issue: summarize(issue) } });
  }),

  /** POST /api/public-servant/issues/:id/update — public action update or internal note. */
  addUpdate: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const body = actionUpdateSchema.parse(req.body);
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError(404, 'Issue not found'));
    const j = await jurisdictionFor(req);
    assertInJurisdiction(j, issue as any);

    let imageUrl: string | undefined;
    if (body.imageBase64) imageUrl = (await StorageService.saveBase64Image(body.imageBase64)).url;

    if (body.status && body.status !== issue.status) {
      if (body.status === 'RESOLVED') return next(new AppError(400, 'Use the resolve endpoint to mark an issue resolved'));
      issue.status = body.status;
      await issue.save();
    }

    const update = await addTimeline({
      issue: String(issue._id), kind: body.visibility === 'INTERNAL' ? 'INTERNAL_NOTE' : 'ACTION_UPDATE',
      author: req.user!.id, authorRole: 'PUBLIC_SERVANT', visibility: body.visibility, status: body.status, message: body.message, imageUrl,
    });

    if (body.visibility === 'PUBLIC') {
      await notify(String(issue.reporterId), { type: 'ACTION_UPDATE', message: body.message, issue: String(issue._id) });
    }
    await audit({ actorId: req.user!.id, actorRole: 'PUBLIC_SERVANT', action: body.visibility === 'INTERNAL' ? 'INTERNAL_NOTE_ADDED' : 'ACTION_UPDATE_ADDED', targetType: 'Issue', targetId: String(issue._id) });

    const author = await User.findById(req.user!.id).select('fullName').lean();
    res.status(201).json({ success: true, data: { update: serializeTimeline({ ...update.toObject(), author }), issue: summarize(issue) } });
  }),

  /** POST /api/public-servant/issues/:id/resolve */
  resolve: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const body = resolveIssueSchema.parse(req.body);
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError(404, 'Issue not found'));
    const j = await jurisdictionFor(req);
    assertInJurisdiction(j, issue as any);
    if (issue.status === 'RESOLVED') return next(new AppError(400, 'This issue is already resolved'));

    let evidenceUrl: string | undefined;
    if (body.evidenceImageBase64) evidenceUrl = (await StorageService.saveBase64Image(body.evidenceImageBase64)).url;

    issue.status = 'RESOLVED';
    issue.resolutionNotes = body.resolutionNotes;
    issue.resolutionDate = new Date();
    issue.resolvedBy = req.user!.id as any;
    if (evidenceUrl) issue.resolutionEvidenceUrl = evidenceUrl;
    await issue.save();

    await addTimeline({ issue: String(issue._id), kind: 'RESOLVED', author: req.user!.id, authorRole: 'PUBLIC_SERVANT', status: 'RESOLVED', message: body.resolutionNotes, imageUrl: evidenceUrl });
    await notify(String(issue.reporterId), { type: 'ISSUE_RESOLVED', message: 'Your reported issue has been marked resolved.', issue: String(issue._id) });
    await audit({ actorId: req.user!.id, actorRole: 'PUBLIC_SERVANT', action: 'ISSUE_RESOLVED', targetType: 'Issue', targetId: String(issue._id) });

    res.json({ success: true, data: { issue: summarize(issue) } });
  }),

  /** GET /api/public-servant/profile — jurisdiction + approval status shown on the servant's own profile. */
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!.id).populate('municipalityId', 'name city state').populate('departmentId', 'name').lean();
    res.json({ success: true, data: { profile: user } });
  }),
};
