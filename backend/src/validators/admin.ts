import { z } from 'zod';
import { PRIORITIES, ISSUE_STATUSES } from '../models/Issue';

const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);

export const listUsersQuery = z.object({
  page, limit,
  q: z.string().trim().max(200).optional(),
  role: z.enum(['CITIZEN', 'PUBLIC_SERVANT', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
});

export const suspendUserSchema = z.object({ reason: z.string().trim().max(500).optional() });

export const listServantsQuery = z.object({
  page, limit,
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
  municipalityId: id.optional(),
  departmentId: id.optional(),
});

export const approveServantSchema = z.object({
  municipalityId: id,
  departmentId: id,
  jurisdictionWards: z.array(z.string().trim().min(1)).max(200).default([]),
});
export const rejectServantSchema = z.object({ reason: z.string().trim().max(500).optional() });

export const listAdminIssuesQuery = z.object({
  page, limit,
  q: z.string().trim().max(200).optional(),
  status: z.enum(ISSUE_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.string().trim().max(60).optional(),
  municipalityId: id.optional(),
  departmentId: id.optional(),
  ward: z.string().trim().max(60).optional(),
  assignedTo: id.optional(),
  moderationStatus: z.enum(['VISIBLE', 'FLAGGED', 'HIDDEN']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sort: z.enum(['newest', 'oldest', 'priority']).default('newest'),
});

export const adminAssignSchema = z.object({ assignedTo: id, departmentId: id.optional(), municipalityId: id.optional() });
export const adminPrioritySchema = z.object({ priority: z.enum(PRIORITIES), reason: z.string().trim().max(500).optional() });
export const moderateSchema = z.object({ moderationStatus: z.enum(['VISIBLE', 'FLAGGED', 'HIDDEN']), reason: z.string().trim().max(500).optional() });

export const municipalitySchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2).max(150),
  type: z.enum(['NAGAR_NIGAM', 'NAGAR_PALIKA', 'NAGAR_PANCHAYAT', 'OTHER']).default('OTHER'),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  wards: z.array(z.string().trim().min(1)).max(500).default([]),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
export const municipalityUpdateSchema = municipalitySchema.partial();

export const departmentSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2).max(100),
  municipality: id,
  categories: z.array(z.string().trim().min(1)).max(50).default([]),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
export const departmentUpdateSchema = departmentSchema.partial().omit({ municipality: true }).extend({ municipality: id.optional() });

const weight = z.coerce.number().min(0).max(1);
export const aiConfigSchema = z.object({
  imageModel: z.string().trim().max(200).optional(),
  imageEmbeddingModel: z.string().trim().max(200).optional(),
  textEmbeddingModel: z.string().trim().max(200).optional(),
  imageSimilarityWeight: weight.optional(),
  textSimilarityWeight: weight.optional(),
  locationWeight: weight.optional(),
  categoryWeight: weight.optional(),
  duplicateThreshold: z.coerce.number().min(0).max(1).optional(),
  duplicateSearchRadius: z.coerce.number().min(50).max(5000).optional(),
});

export const priorityConfigSchema = z.object({
  weights: z.object({
    upvotes: weight, severity: weight, age: weight, affected: weight, status: weight, context: weight,
  }).partial().optional(),
  caps: z.object({
    upvotes: z.coerce.number().min(1), ageDays: z.coerce.number().min(1), affected: z.coerce.number().min(1), context: z.coerce.number().min(1),
  }).partial().optional(),
  thresholds: z.object({
    critical: z.coerce.number().min(0).max(100), high: z.coerce.number().min(0).max(100), medium: z.coerce.number().min(0).max(100),
  }).partial().optional(),
  categorySeverity: z.record(z.coerce.number().min(0).max(1)).optional(),
});

export const auditLogQuery = z.object({
  page, limit,
  action: z.string().trim().max(100).optional(),
  actorId: id.optional(),
  targetType: z.string().trim().max(60).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const analyticsQuery = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  municipalityId: id.optional(),
});
