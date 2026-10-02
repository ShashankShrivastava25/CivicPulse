import type { Request } from 'express';
import { AppError } from '../utils/AppError';
import { User } from '../models';

export interface Jurisdiction {
  municipalityId?: string;
  departmentId?: string;
  wards?: string[]; // empty/undefined = whole municipality
}

/**
 * Loads the acting public servant's jurisdiction from the database (never from the request body/query)
 * and returns a Mongo filter that scopes issue queries to it. This is the single place jurisdiction
 * is derived, so every public-servant route enforces the same rule server-side.
 */
export async function jurisdictionFor(req: Request): Promise<Jurisdiction> {
  if (!req.user) throw new AppError(401, 'Please sign in to continue');
  const servant = await User.findById(req.user.id).select('municipalityId departmentId jurisdictionWards role').lean();
  if (!servant) throw new AppError(401, 'Account not found');
  return {
    municipalityId: servant.municipalityId ? String(servant.municipalityId) : undefined,
    departmentId: servant.departmentId ? String(servant.departmentId) : undefined,
    wards: servant.jurisdictionWards?.length ? servant.jurisdictionWards : undefined,
  };
}

export function jurisdictionQuery(j: Jurisdiction): Record<string, unknown> {
  const q: Record<string, unknown> = {};
  if (j.municipalityId) q.municipalityId = j.municipalityId;
  if (j.departmentId) q.departmentId = j.departmentId;
  if (j.wards?.length) q.ward = { $in: j.wards };
  return q;
}

/**
 * Builds the Mongo filter a public servant's issue list uses. An issue is visible to them if:
 *  - it's already assigned to them, OR
 *  - it has been triaged into their department (and, if they're ward-restricted, their ward), OR
 *  - it hasn't been triaged yet (no department set) but sits in their municipality and matches a
 *    category their department handles — so new reports still reach the right servant's queue.
 * This is the ONLY place that decides what a servant can see; controllers must use it rather than
 * trusting any municipality/department/ward value the client sends.
 */
export function visibilityQuery(j: Jurisdiction, servantId: string, deptCategories: string[]): Record<string, unknown> {
  const wardMatch = j.wards?.length ? { ward: { $in: j.wards } } : {};
  const clauses: Record<string, unknown>[] = [{ assignedTo: servantId }];
  if (j.departmentId) clauses.push({ departmentId: j.departmentId, ...wardMatch });
  if (j.municipalityId) {
    clauses.push({
      municipalityId: j.municipalityId,
      departmentId: { $exists: false },
      ...(deptCategories.length ? { category: { $in: deptCategories } } : {}),
      ...wardMatch,
    });
  }
  if (!j.departmentId && !j.municipalityId) {
    // No jurisdiction assigned yet — admin hasn't set it up. Don't silently show everything.
    return { assignedTo: servantId };
  }
  return { $or: clauses };
}

/** Throws if the given issue falls outside the servant's jurisdiction. Call before any mutation. */
export function assertInJurisdiction(j: Jurisdiction, issue: { municipalityId?: unknown; departmentId?: unknown; ward?: string }) {
  if (j.municipalityId && String(issue.municipalityId ?? '') !== j.municipalityId) {
    throw new AppError(403, 'This issue is outside your assigned jurisdiction');
  }
  if (j.departmentId && String(issue.departmentId ?? '') !== j.departmentId) {
    throw new AppError(403, 'This issue is outside your assigned department');
  }
  if (j.wards?.length && issue.ward && !j.wards.includes(issue.ward)) {
    throw new AppError(403, 'This issue is outside your assigned ward');
  }
}
