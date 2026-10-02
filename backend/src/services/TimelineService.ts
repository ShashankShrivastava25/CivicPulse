import { IssueUpdate } from '../models';

interface TimelineInput {
  issue: string;
  kind: string;
  message?: string;
  status?: string;
  author?: string;
  authorRole?: 'CITIZEN' | 'PUBLIC_SERVANT' | 'ADMIN' | 'SYSTEM';
  visibility?: 'PUBLIC' | 'INTERNAL';
  imageUrl?: string;
  meta?: Record<string, unknown>;
}

export async function addTimeline(i: TimelineInput) {
  return IssueUpdate.create({ visibility: 'PUBLIC', authorRole: 'SYSTEM', ...i });
}

/** Shapes a timeline row for the API. Author identity is limited to name + role. */
export function serializeTimeline(u: any) {
  const author = u.author && typeof u.author === 'object' && u.author.fullName ? { id: String(u.author._id), name: u.author.fullName } : undefined;
  return {
    id: String(u._id), kind: u.kind, visibility: u.visibility, status: u.status, message: u.message ?? u.note,
    imageUrl: u.imageUrl, author, authorRole: u.authorRole, createdAt: u.createdAt, meta: u.meta,
  };
}
