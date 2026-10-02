import { api } from '@/lib/api';
import type {
  AiConfig, Analytics, AuditLogEntry, Department, DuplicateAnalytics, IssueSummary, Municipality,
  Pagination, PriorityConfig, Servant, TimelineEntry, User,
} from '@/types';

const qs = (f: Record<string, unknown>) => {
  const params = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.set(k, String(v)); });
  const s = params.toString();
  return s ? `?${s}` : '';
};

export const adminService = {
  // Users
  listUsers: (f: Record<string, unknown>) => api<{ users: User[]; pagination: Pagination }>(`/admin/users${qs(f)}`),
  suspendUser: (id: string, reason?: string) => api(`/admin/users/${id}/suspend`, { method: 'PATCH', body: { reason } }),
  reactivateUser: (id: string) => api(`/admin/users/${id}/reactivate`, { method: 'PATCH' }),

  // Public servants
  listServants: (f: Record<string, unknown>) => api<{ servants: Servant[]; pagination: Pagination }>(`/admin/public-servants${qs(f)}`),
  approveServant: (id: string, body: { municipalityId: string; departmentId: string; jurisdictionWards: string[] }) =>
    api(`/admin/public-servants/${id}/approve`, { method: 'PATCH', body }),
  rejectServant: (id: string, reason?: string) => api(`/admin/public-servants/${id}/reject`, { method: 'PATCH', body: { reason } }),
  suspendServant: (id: string, reason?: string) => api(`/admin/public-servants/${id}/suspend`, { method: 'PATCH', body: { reason } }),
  reactivateServant: (id: string) => api(`/admin/public-servants/${id}/reactivate`, { method: 'PATCH' }),

  // Issues
  listIssues: (f: Record<string, unknown>) => api<{ issues: IssueSummary[]; pagination: Pagination }>(`/admin/issues${qs(f)}`),
  getIssue: (id: string) => api<{ issue: IssueSummary & Record<string, unknown>; timeline: TimelineEntry[] }>(`/admin/issues/${id}`),
  assignIssue: (id: string, body: { assignedTo: string; departmentId?: string; municipalityId?: string }) =>
    api(`/admin/issues/${id}/assign`, { method: 'PATCH', body }),
  changeStatus: (id: string, status: string) => api(`/admin/issues/${id}/status`, { method: 'PATCH', body: { status } }),
  changePriority: (id: string, priority: string, reason?: string) => api(`/admin/issues/${id}/priority`, { method: 'PATCH', body: { priority, reason } }),
  moderateIssue: (id: string, moderationStatus: string, reason?: string) => api(`/admin/issues/${id}/moderate`, { method: 'PATCH', body: { moderationStatus, reason } }),
  getDuplicateCandidates: (id: string) => api(`/admin/issues/${id}/duplicates`),

  // Municipalities
  listMunicipalities: () => api<{ municipalities: Municipality[] }>('/admin/municipalities').then((d) => d.municipalities),
  createMunicipality: (body: Partial<Municipality>) => api('/admin/municipalities', { method: 'POST', body }),
  updateMunicipality: (id: string, body: Partial<Municipality>) => api(`/admin/municipalities/${id}`, { method: 'PATCH', body }),
  deactivateMunicipality: (id: string) => api(`/admin/municipalities/${id}/deactivate`, { method: 'PATCH' }),

  // Departments
  listDepartments: (municipalityId?: string) => api<{ departments: Department[] }>(`/admin/departments${qs({ municipalityId })}`).then((d) => d.departments),
  createDepartment: (body: { name: string; municipality: string; categories: string[] }) => api('/admin/departments', { method: 'POST', body }),
  updateDepartment: (id: string, body: Partial<Department>) => api(`/admin/departments/${id}`, { method: 'PATCH', body }),
  deactivateDepartment: (id: string) => api(`/admin/departments/${id}/deactivate`, { method: 'PATCH' }),

  // AI + priority configuration
  getAiConfiguration: () => api<{ ai: AiConfig; priority: PriorityConfig; apiKeyConfigured: boolean }>('/admin/ai-configuration'),
  updateAiConfiguration: (body: Partial<AiConfig>) => api<{ ai: AiConfig }>('/admin/ai-configuration', { method: 'PATCH', body }),
  updatePriorityConfiguration: (body: Partial<PriorityConfig>) => api<{ priority: PriorityConfig }>('/admin/priority-configuration', { method: 'PATCH', body }),
  duplicateAnalytics: () => api<DuplicateAnalytics>('/admin/duplicate-analytics'),

  // Analytics + audit
  analytics: (f: Record<string, unknown> = {}) => api<Analytics>(`/admin/analytics${qs(f)}`),
  auditLogs: (f: Record<string, unknown>) => api<{ logs: AuditLogEntry[]; pagination: Pagination }>(`/admin/audit-logs${qs(f)}`),
};
