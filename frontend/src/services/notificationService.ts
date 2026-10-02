import { api } from '@/lib/api';
import type { AppNotification, Pagination } from '@/types';

export const notificationService = {
  list: (page = 1, limit = 20, unreadOnly = false) =>
    api<{ notifications: AppNotification[]; unreadCount: number; pagination: Pagination }>(
      `/notifications?page=${page}&limit=${limit}${unreadOnly ? '&unreadOnly=true' : ''}`
    ),
  markRead: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => api('/notifications/read-all', { method: 'PATCH' }),
};
