import { api } from '@/lib/api';
import type { DashboardStats, IssueSummary, Pagination, TimelineEntry } from '@/types';

export interface IssueFilters {
  page?: number; limit?: number; q?: string; status?: string; priority?: string; category?: string;
  ward?: string; assignedTo?: string; sort?: 'newest' | 'oldest' | 'priority';
}

const qs = (f: Record<string, unknown>) => {
  const params = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.set(k, String(v)); });
  const s = params.toString();
  return s ? `?${s}` : '';
};

export const staffService = {
  dashboard: () =>
    api<{ stats: DashboardStats }>("/public-servant/dashboard").then(
      (d) => d.stats,
    ),
  priorityQueue: (limit = 50) =>
    api<{ issues: IssueSummary[] }>(
      `/public-servant/priority-queue?limit=${limit}`,
    ).then((d) => d.issues),
  listIssues: (f: IssueFilters) =>
    api<{ issues: IssueSummary[]; pagination: Pagination }>(
      `/public-servant/issues${qs({ ...f })}`,
    ),
  getIssue: (id: string) =>
    api<{
      issue: IssueSummary & {
        reporter?: unknown;
        resolutionNotes?: string;
        resolutionEvidenceUrl?: string;
        resolutionDate?: string;
        timeline: TimelineEntry[];
      };
    }>(`/public-servant/issues/${id}`).then((d) => d.issue),
  changeStatus: (id: string, status: string, message?: string) =>
    api(`/public-servant/issues/${id}/status`, {
      method: "PATCH",
      body: { status, message },
    }),
  assign: (id: string, assignedTo: string) =>
    api(`/public-servant/issues/${id}/assign`, {
      method: "POST",
      body: { assignedTo },
    }),
  accept: (id: string) =>
    api(`/public-servant/issues/${id}/accept`, { method: "POST" }),
  addUpdate: (
    id: string,
    body: {
      message: string;
      status?: string;
      visibility?: "PUBLIC" | "INTERNAL";
      imageBase64?: string;
    },
  ) => api(`/public-servant/issues/${id}/update`, { method: "POST", body }),
  resolve: (
    id: string,
    body: {
      resolutionNotes: string;
      evidenceImageBase64?: string;
      confirmed: true;
    },
  ) => api(`/public-servant/issues/${id}/resolve`, { method: "POST", body }),
  profile: () => api("/public-servant/profile"),
};
