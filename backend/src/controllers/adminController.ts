import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Issue, ISSUE_STATUSES } from '../models/Issue';
import { Municipality } from '../models/Municipality';
import { Department } from '../models/Department';
import { AuditLog } from '../models/AuditLog';
import { DuplicateEvent } from '../models/DuplicateEvent';
import { IssueUpdate } from '../models/IssueUpdate';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { audit } from '../services/AuditService';
import { notify } from '../services/NotificationService';
import { addTimeline, serializeTimeline } from '../services/TimelineService';
import { HuggingFaceService } from '../services/HuggingFaceService';
import { getAiConfig, getPriorityConfig, saveSetting } from '../services/SettingsService';
import {
  listUsersQuery, suspendUserSchema, listServantsQuery, approveServantSchema, rejectServantSchema,
  listAdminIssuesQuery, adminAssignSchema, adminPrioritySchema, moderateSchema,
  municipalitySchema, municipalityUpdateSchema, departmentSchema, departmentUpdateSchema,
  aiConfigSchema, priorityConfigSchema, auditLogQuery, analyticsQuery,
} from '../validators/admin';

const paginate = <T extends { page: number; limit: number }>(p: T) => ({ skip: (p.page - 1) * p.limit, limit: p.limit });

export const adminController = {
  // ---------------------------------------------------------------- USERS
  /** GET /api/admin/users — never returns passwordHash (excluded by the schema's select:false + toJSON transform). */
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const p = listUsersQuery.parse(req.query);
    const filter: Record<string, unknown> = {};
    if (p.role) filter.role = p.role;
    if (p.status) filter.accountStatus = p.status;
    if (p.q) filter.$or = [{ fullName: { $regex: p.q, $options: 'i' } }, { email: { $regex: p.q, $options: 'i' } }];
    const { skip, limit } = paginate(p);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: { users, pagination: { page: p.page, limit, total, pages: Math.ceil(total / limit) } } });
  }),

  suspendUser: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { reason } = suspendUserSchema.parse(req.body);
    if (req.params.id === req.user!.id) return next(new AppError(400, 'You cannot suspend your own account'));
    const user = await User.findByIdAndUpdate(req.params.id, { accountStatus: 'SUSPENDED', statusReason: reason }, { new: true });
    if (!user) return next(new AppError(404, 'User not found'));
    await notify(user.id, { type: 'ACCOUNT_STATUS', message: 'Your account has been suspended by an administrator.' });
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'USER_SUSPENDED', targetType: 'User', targetId: user.id, metadata: { reason } });
    res.json({ success: true, data: { user } });
  }),

  reactivateUser: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError(404, 'User not found'));
    user.accountStatus = user.role === 'PUBLIC_SERVANT' ? 'APPROVED' : 'ACTIVE';
    user.statusReason = undefined;
    await user.save();
    await notify(user.id, { type: 'ACCOUNT_STATUS', message: 'Your account has been reactivated.' });
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'USER_REACTIVATED', targetType: 'User', targetId: user.id });
    res.json({ success: true, data: { user } });
  }),

  // --------------------------------------------------------- PUBLIC SERVANTS
  listServants: asyncHandler(async (req: Request, res: Response) => {
    const p = listServantsQuery.parse(req.query);
    const filter: Record<string, unknown> = { role: 'PUBLIC_SERVANT' };
    if (p.status) filter.accountStatus = p.status;
    if (p.municipalityId) filter.municipalityId = p.municipalityId;
    if (p.departmentId) filter.departmentId = p.departmentId;
    const { skip, limit } = paginate(p);
    const [servants, total] = await Promise.all([
      User.find(filter).populate('municipalityId', 'name city state').populate('departmentId', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: { servants, pagination: { page: p.page, limit, total, pages: Math.ceil(total / limit) } } });
  }),

  /** PATCH /api/admin/public-servants/:id/approve — assigns jurisdiction and flips PENDING → APPROVED. */
  approveServant: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const body = approveServantSchema.parse(req.body);
    const servant = await User.findOne({ _id: req.params.id, role: 'PUBLIC_SERVANT' });
    if (!servant) return next(new AppError(404, 'Public servant not found'));
    const [municipality, department] = await Promise.all([
      Municipality.findById(body.municipalityId).lean(),
      Department.findById(body.departmentId).lean(),
    ]);
    if (!municipality) return next(new AppError(400, 'Choose a valid municipality'));
    if (!department) return next(new AppError(400, 'Choose a valid department'));

    servant.accountStatus = 'APPROVED';
    servant.municipalityId = body.municipalityId as any;
    servant.departmentId = body.departmentId as any;
    servant.jurisdictionWards = body.jurisdictionWards;
    servant.statusReason = undefined;
    await servant.save();

    await notify(servant.id, { type: 'ACCOUNT_STATUS', message: 'Your public servant account has been approved. You can now access the dashboard.' });
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'SERVANT_APPROVED', targetType: 'User', targetId: servant.id, metadata: body });
    res.json({ success: true, data: { servant } });
  }),

  rejectServant: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { reason } = rejectServantSchema.parse(req.body);
    const servant = await User.findOneAndUpdate({ _id: req.params.id, role: 'PUBLIC_SERVANT' }, { accountStatus: 'REJECTED', statusReason: reason }, { new: true });
    if (!servant) return next(new AppError(404, 'Public servant not found'));
    await notify(servant.id, { type: 'ACCOUNT_STATUS', message: reason ? `Your public servant registration was not approved: ${reason}` : 'Your public servant registration was not approved.' });
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'SERVANT_REJECTED', targetType: 'User', targetId: servant.id, metadata: { reason } });
    res.json({ success: true, data: { servant } });
  }),

  suspendServant: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { reason } = suspendUserSchema.parse(req.body);
    const servant = await User.findOneAndUpdate({ _id: req.params.id, role: 'PUBLIC_SERVANT' }, { accountStatus: 'SUSPENDED', statusReason: reason }, { new: true });
    if (!servant) return next(new AppError(404, 'Public servant not found'));
    await notify(servant.id, { type: 'ACCOUNT_STATUS', message: 'Your public servant account has been suspended by an administrator.' });
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'SERVANT_SUSPENDED', targetType: 'User', targetId: servant.id, metadata: { reason } });
    res.json({ success: true, data: { servant } });
  }),

  reactivateServant: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const servant = await User.findOneAndUpdate({ _id: req.params.id, role: 'PUBLIC_SERVANT' }, { accountStatus: 'APPROVED', statusReason: undefined }, { new: true });
    if (!servant) return next(new AppError(404, 'Public servant not found'));
    await notify(servant.id, { type: 'ACCOUNT_STATUS', message: 'Your public servant account has been reactivated.' });
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'SERVANT_REACTIVATED', targetType: 'User', targetId: servant.id });
    res.json({ success: true, data: { servant } });
  }),

  // ------------------------------------------------------------------ ISSUES
  listIssues: asyncHandler(async (req: Request, res: Response) => {
    const p = listAdminIssuesQuery.parse(req.query);
    const filter: Record<string, unknown> = {};
    if (p.q) filter.$or = [{ description: { $regex: p.q, $options: 'i' } }, { category: { $regex: p.q, $options: 'i' } }, { address: { $regex: p.q, $options: 'i' } }];
    if (p.status) filter.status = p.status;
    if (p.priority) filter.priority = p.priority;
    if (p.category) filter.category = p.category;
    if (p.municipalityId) filter.municipalityId = p.municipalityId;
    if (p.departmentId) filter.departmentId = p.departmentId;
    if (p.ward) filter.ward = p.ward;
    if (p.assignedTo) filter.assignedTo = p.assignedTo;
    if (p.moderationStatus) filter.moderationStatus = p.moderationStatus;
    if (p.dateFrom || p.dateTo) filter.createdAt = { ...(p.dateFrom ? { $gte: p.dateFrom } : {}), ...(p.dateTo ? { $lte: p.dateTo } : {}) };

    const sort = p.sort === 'oldest' ? { createdAt: 1 } : p.sort === 'priority' ? { priorityScore: -1, createdAt: -1 } : { createdAt: -1 };
    const { skip, limit } = paginate(p);
    const [issues, total] = await Promise.all([
      Issue.find(filter).sort(sort as any).skip(skip).limit(limit)
        .populate('reporterId', 'fullName').populate('assignedTo', 'fullName').populate('departmentId', 'name').lean(),
      Issue.countDocuments(filter),
    ]);
    res.json({ success: true, data: { issues, pagination: { page: p.page, limit, total, pages: Math.ceil(total / limit) } } });
  }),

  getIssue: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const issue = await Issue.findById(req.params.id)
      .populate('reporterId', 'fullName email phone').populate('assignedTo', 'fullName email')
      .populate('departmentId', 'name').populate('municipalityId', 'name city state')
      .populate('duplicateCandidates.issueId', 'category description imageUrl status');
    if (!issue) return next(new AppError(404, 'Issue not found'));
    const timeline = (await IssueUpdate.find({ issue: issue._id }).sort({ createdAt: 1 }).populate('author', 'fullName').lean()).map(serializeTimeline);
    res.json({ success: true, data: { issue, timeline } });
  }),

  /** PATCH /api/admin/issues/:id/assign — admins may assign/reassign to any approved servant. */
  assignIssue: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const body = adminAssignSchema.parse(req.body);
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError(404, 'Issue not found'));
    const servant = await User.findOne({ _id: body.assignedTo, role: 'PUBLIC_SERVANT', accountStatus: 'APPROVED' }).lean();
    if (!servant) return next(new AppError(400, 'Choose an approved public servant to assign this to'));

    const wasAssigned = !!issue.assignedTo;
    issue.assignedTo = body.assignedTo as any;
    issue.assignedAt = new Date();
    if (body.departmentId) issue.departmentId = body.departmentId as any;
    else if (servant.departmentId) issue.departmentId = servant.departmentId;
    if (body.municipalityId) issue.municipalityId = body.municipalityId as any;
    else if (servant.municipalityId) issue.municipalityId = servant.municipalityId;
    if (issue.status === 'REPORTED' || issue.status === 'UNDER_REVIEW') issue.status = 'ASSIGNED';
    await issue.save();

    await addTimeline({ issue: String(issue._id), kind: wasAssigned ? 'REASSIGNED' : 'ASSIGNED', author: req.user!.id, authorRole: 'ADMIN', status: issue.status, message: `${wasAssigned ? 'Reassigned' : 'Assigned'} to ${servant.fullName} by an administrator` });
    await notify(String(body.assignedTo), { type: wasAssigned ? 'ISSUE_REASSIGNED' : 'NEW_ASSIGNMENT', message: 'An issue has been assigned to you by an administrator.', issue: String(issue._id) });
    await notify(String(issue.reporterId), { type: 'ISSUE_ASSIGNED', message: 'Your report has been assigned to a public servant.', issue: String(issue._id) });
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: wasAssigned ? 'ISSUE_REASSIGNED' : 'ISSUE_ASSIGNED', targetType: 'Issue', targetId: String(issue._id), metadata: body });

    res.json({ success: true, data: { issue } });
  }),

  changeStatus: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const status = String(req.body.status);
    if (!ISSUE_STATUSES.includes(status as any)) return next(new AppError(400, 'Invalid status'));
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError(404, 'Issue not found'));
    const from = issue.status;
    issue.status = status as any;
    await issue.save();
    await addTimeline({ issue: String(issue._id), kind: 'STATUS_CHANGE', author: req.user!.id, authorRole: 'ADMIN', status, message: `Status changed to ${status.replace('_', ' ')} by an administrator` });
    await notify(String(issue.reporterId), { type: 'STATUS_CHANGED', message: `Your report is now ${status.replace('_', ' ').toLowerCase()}.`, issue: String(issue._id) });
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'ISSUE_STATUS_CHANGED', targetType: 'Issue', targetId: String(issue._id), metadata: { from, to: status } });
    res.json({ success: true, data: { issue } });
  }),

  /** PATCH /api/admin/issues/:id/priority — manual override; marks priorityOverride so auto-recompute won't silently undo it. */
  changePriority: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { priority, reason } = adminPrioritySchema.parse(req.body);
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError(404, 'Issue not found'));
    const from = issue.priority;
    issue.priority = priority;
    issue.priorityOverride = true;
    issue.priorityReasons = [reason || 'Priority set manually by an administrator'];
    await issue.save();
    await addTimeline({ issue: String(issue._id), kind: 'PRIORITY_CHANGE', author: req.user!.id, authorRole: 'ADMIN', visibility: 'INTERNAL', message: `Priority changed from ${from} to ${priority}${reason ? `: ${reason}` : ''}` });
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'ISSUE_PRIORITY_CHANGED', targetType: 'Issue', targetId: String(issue._id), metadata: { from, to: priority, reason } });
    res.json({ success: true, data: { issue } });
  }),

  /** PATCH /api/admin/issues/:id/moderate — HIDDEN removes an issue from citizen-facing lists. */
  moderateIssue: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { moderationStatus, reason } = moderateSchema.parse(req.body);
    const issue = await Issue.findByIdAndUpdate(req.params.id, { moderationStatus }, { new: true });
    if (!issue) return next(new AppError(404, 'Issue not found'));
    await addTimeline({ issue: String(issue._id), kind: 'MODERATION', author: req.user!.id, authorRole: 'ADMIN', visibility: 'INTERNAL', message: `Moderation status set to ${moderationStatus}${reason ? `: ${reason}` : ''}` });
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'ISSUE_MODERATED', targetType: 'Issue', targetId: String(issue._id), metadata: { moderationStatus, reason } });
    res.json({ success: true, data: { issue } });
  }),

  /** GET /api/admin/issues/:id/duplicates — the AI-suggested candidates stored on the issue itself. */
  getDuplicateCandidates: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const issue = await Issue.findById(req.params.id).populate('duplicateCandidates.issueId', 'category description imageUrl status createdAt').lean();
    if (!issue) return next(new AppError(404, 'Issue not found'));
    res.json({ success: true, data: { candidates: issue.duplicateCandidates ?? [] } });
  }),

  // ------------------------------------------------------------- MUNICIPALITIES
  listMunicipalities: asyncHandler(async (_req: Request, res: Response) => {
    const municipalities = await Municipality.find().sort({ name: 1 }).lean();
    const departmentCounts = await Department.aggregate([{ $group: { _id: '$municipality', count: { $sum: 1 } } }]);
    const counts = new Map(departmentCounts.map((d) => [String(d._id), d.count]));
    res.json({ success: true, data: { municipalities: municipalities.map((m) => ({ ...m, departmentCount: counts.get(String(m._id)) ?? 0 })) } });
  }),

  createMunicipality: asyncHandler(async (req: Request, res: Response) => {
    const body = municipalitySchema.parse(req.body);
    const municipality = await Municipality.create(body);
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'MUNICIPALITY_CREATED', targetType: 'Municipality', targetId: municipality.id, metadata: body });
    res.status(201).json({ success: true, data: { municipality } });
  }),

  updateMunicipality: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const body = municipalityUpdateSchema.parse(req.body);
    const municipality = await Municipality.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!municipality) return next(new AppError(404, 'Municipality not found'));
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'MUNICIPALITY_UPDATED', targetType: 'Municipality', targetId: municipality.id, metadata: body });
    res.json({ success: true, data: { municipality } });
  }),

  deactivateMunicipality: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const municipality = await Municipality.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' }, { new: true });
    if (!municipality) return next(new AppError(404, 'Municipality not found'));
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'MUNICIPALITY_DEACTIVATED', targetType: 'Municipality', targetId: municipality.id });
    res.json({ success: true, data: { municipality } });
  }),

  // -------------------------------------------------------------- DEPARTMENTS
  listDepartments: asyncHandler(async (req: Request, res: Response) => {
    const filter: Record<string, unknown> = {};
    if (req.query.municipalityId) filter.municipality = req.query.municipalityId;
    const departments = await Department.find(filter).populate('municipality', 'name city').sort({ name: 1 }).lean();
    res.json({ success: true, data: { departments } });
  }),

  createDepartment: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const body = departmentSchema.parse(req.body);
    const municipality = await Municipality.findById(body.municipality).lean();
    if (!municipality) return next(new AppError(400, 'Choose a valid municipality'));
    const department = await Department.create(body);
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'DEPARTMENT_CREATED', targetType: 'Department', targetId: department.id, metadata: body });
    res.status(201).json({ success: true, data: { department } });
  }),

  updateDepartment: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const body = departmentUpdateSchema.parse(req.body);
    const department = await Department.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!department) return next(new AppError(404, 'Department not found'));
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'DEPARTMENT_UPDATED', targetType: 'Department', targetId: department.id, metadata: body });
    res.json({ success: true, data: { department } });
  }),

  deactivateDepartment: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const department = await Department.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' }, { new: true });
    if (!department) return next(new AppError(404, 'Department not found'));
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'DEPARTMENT_DEACTIVATED', targetType: 'Department', targetId: department.id });
    res.json({ success: true, data: { department } });
  }),

  // ------------------------------------------------------------- AI CONFIGURATION
  /** GET /api/admin/ai-configuration — the Hugging Face API key is NEVER included; only whether one is set. */
  getAiConfiguration: asyncHandler(async (_req: Request, res: Response) => {
    const [ai, priority] = await Promise.all([getAiConfig(), getPriorityConfig()]);
    res.json({ success: true, data: { ai, priority, apiKeyConfigured: HuggingFaceService.hasApiKey() } });
  }),

  updateAiConfiguration: asyncHandler(async (req: Request, res: Response) => {
    const body = aiConfigSchema.parse(req.body);
    await saveSetting('ai.config', body, req.user!.id);
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'AI_CONFIG_UPDATED', targetType: 'Setting', targetId: 'ai.config', metadata: body });
    res.json({ success: true, data: { ai: await getAiConfig() } });
  }),

  updatePriorityConfiguration: asyncHandler(async (req: Request, res: Response) => {
    const body = priorityConfigSchema.parse(req.body);
    await saveSetting('priority.config', body, req.user!.id);
    await audit({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'PRIORITY_CONFIG_UPDATED', targetType: 'Setting', targetId: 'priority.config', metadata: body });
    res.json({ success: true, data: { priority: await getPriorityConfig() } });
  }),

  /** GET /api/admin/duplicate-analytics — clearly separates AI-suggested from citizen-confirmed/rejected. */
  duplicateAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    const [totalIssues, byOutcome] = await Promise.all([
      Issue.countDocuments(),
      DuplicateEvent.aggregate([{ $group: { _id: '$outcome', count: { $sum: 1 } } }]),
    ]);
    const counts: Record<string, number> = { SUGGESTED: 0, CONFIRMED: 0, REJECTED: 0 };
    for (const row of byOutcome) counts[row._id] = row.count;
    res.json({
      success: true,
      data: {
        totalIssues,
        aiSuggestedDuplicates: counts.SUGGESTED,
        citizenConfirmedDuplicates: counts.CONFIRMED,
        citizenRejectedSuggestions: counts.REJECTED,
        duplicateReportsPrevented: counts.CONFIRMED, // a confirmed duplicate is a report that was NOT filed
      },
    });
  }),

  // ---------------------------------------------------------------- ANALYTICS
  /** GET /api/admin/analytics — every number here is a real aggregation, never a placeholder. */
  analytics: asyncHandler(async (req: Request, res: Response) => {
    const p = analyticsQuery.parse(req.query);
    const match: Record<string, unknown> = {};
    if (p.municipalityId) match.municipalityId = p.municipalityId;
    if (p.dateFrom || p.dateTo) match.createdAt = { ...(p.dateFrom ? { $gte: p.dateFrom } : {}), ...(p.dateTo ? { $lte: p.dateTo } : {}) };

    const [totals, byCategory, byMunicipality, byDepartment, byPriority, overTime, resolutionAgg] = await Promise.all([
      Issue.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Issue.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Issue.aggregate([
        { $match: match }, { $group: { _id: '$municipalityId', count: { $sum: 1 } } },
        { $lookup: { from: 'municipalities', localField: '_id', foreignField: '_id', as: 'm' } },
        { $project: { count: 1, name: { $ifNull: [{ $arrayElemAt: ['$m.name', 0] }, 'Unassigned'] } } },
        { $sort: { count: -1 } },
      ]),
      Issue.aggregate([
        { $match: match }, { $group: { _id: '$departmentId', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'd' } },
        { $project: { count: 1, name: { $ifNull: [{ $arrayElemAt: ['$d.name', 0] }, 'Unassigned'] } } },
        { $sort: { count: -1 } },
      ]),
      Issue.aggregate([{ $match: match }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Issue.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 90 },
      ]),
      Issue.aggregate([
        { $match: { ...match, status: 'RESOLVED', resolutionDate: { $exists: true } } },
        { $project: { hours: { $divide: [{ $subtract: ['$resolutionDate', '$createdAt'] }, 3_600_000] } } },
        { $group: { _id: null, avgHours: { $avg: '$hours' }, count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts: Record<string, number> = Object.fromEntries(ISSUE_STATUSES.map((s) => [s, 0]));
    for (const row of totals) statusCounts[row._id] = row.count;
    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const open = statusCounts.REPORTED + statusCounts.UNDER_REVIEW + statusCounts.ASSIGNED;

    res.json({
      success: true,
      data: {
        totalReports: total,
        openReports: open,
        inProgress: statusCounts.IN_PROGRESS,
        resolved: statusCounts.RESOLVED,
        rejected: statusCounts.REJECTED,
        byCategory: byCategory.map((r) => ({ category: r._id ?? 'Uncategorized', count: r.count })),
        byMunicipality: byMunicipality.map((r) => ({ municipality: r.name, count: r.count })),
        byDepartment: byDepartment.map((r) => ({ department: r.name, count: r.count })),
        byPriority: byPriority.map((r) => ({ priority: r._id, count: r.count })),
        reportsOverTime: overTime.map((r) => ({ date: r._id, count: r.count })),
        averageResolutionHours: resolutionAgg[0] ? Math.round(resolutionAgg[0].avgHours * 10) / 10 : null,
        resolvedCount: resolutionAgg[0]?.count ?? 0,
      },
    });
  }),

  // --------------------------------------------------------------- AUDIT LOGS
  auditLogs: asyncHandler(async (req: Request, res: Response) => {
    const p = auditLogQuery.parse(req.query);
    const filter: Record<string, unknown> = {};
    if (p.action) filter.action = p.action;
    if (p.actorId) filter.actorId = p.actorId;
    if (p.targetType) filter.targetType = p.targetType;
    if (p.dateFrom || p.dateTo) filter.timestamp = { ...(p.dateFrom ? { $gte: p.dateFrom } : {}), ...(p.dateTo ? { $lte: p.dateTo } : {}) };
    const { skip, limit } = paginate(p);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).populate('actorId', 'fullName email role').lean(),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ success: true, data: { logs, pagination: { page: p.page, limit, total, pages: Math.ceil(total / limit) } } });
  }),
};
