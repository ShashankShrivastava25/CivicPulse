import { z } from 'zod';
import { ISSUE_STATUSES, PRIORITIES } from '../models/Issue';

const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);

export const listIssuesQuery = z.object({
  page, limit,
  q: z.string().trim().max(200).optional(),
  status: z.enum(ISSUE_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.string().trim().max(60).optional(),
  municipalityId: id.optional(),
  departmentId: id.optional(),
  ward: z.string().trim().max(60).optional(),
  assignedTo: id.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sort: z.enum(['newest', 'oldest', 'priority']).default('newest'),
});

export const changeStatusSchema = z.object({
  status: z.enum(ISSUE_STATUSES),
  message: z.string().trim().max(1000).optional(),
});

export const assignIssueSchema = z.object({
  assignedTo: id,
});

export const actionUpdateSchema = z.object({
  message: z.string({ required_error: 'Update message is required' }).trim().min(3, 'Write a short update').max(1000),
  status: z.enum(ISSUE_STATUSES).optional(),
  imageBase64: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'INTERNAL']).default('PUBLIC'),
});

export const resolveIssueSchema = z.object({
  resolutionNotes: z.string({ required_error: 'Describe the action taken' }).trim().min(3).max(1000),
  evidenceImageBase64: z.string().optional(),
  confirmed: z.literal(true, { errorMap: () => ({ message: 'Please confirm the issue has been resolved' }) }),
});

export const prioritySchema = z.object({
  priority: z.enum(PRIORITIES),
  reason: z.string().trim().max(500).optional(),
});
