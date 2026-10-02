'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Bell as BellIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { SkeletonRows } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { notificationService } from '@/services/notificationService';
import { timeAgo, formatDateTime } from '@/lib/statusMeta';
import { cn } from '@/utils/cn';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationService.list(page, 20),
  });

  const markAllRead = async () => {
    await notificationService.markAllRead();
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markRead = async (id: string) => {
    await notificationService.markRead(id);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <DashboardLayout title="Notifications">
      {() => (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted">{data ? `${data.unreadCount} unread` : ' '}</p>
            {!!data?.unreadCount && <Button variant="secondary" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4" />Mark all read</Button>}
          </div>

          {isLoading && <SkeletonRows rows={6} />}
          {isError && <ErrorState message="We could not load your notifications." onRetry={() => refetch()} />}
          {!isLoading && !isError && !data?.notifications.length && (
            <EmptyState title="No notifications yet" description="You'll see updates about your reports and account here." action={<BellIcon className="h-5 w-5 text-muted" />} />
          )}

          <div className="divide-y divide-line">
            {data?.notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => !n.read && markRead(n._id)}
                className={cn('flex w-full items-start justify-between gap-3 py-3 text-left', !n.read && 'bg-primary-soft/30')}
              >
                <div>
                  {n.title && <p className="text-sm font-medium">{n.title}</p>}
                  <p className="text-sm text-fg">{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted" title={formatDateTime(n.createdAt)}>{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              </button>
            ))}
          </div>

          {data?.pagination && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />}
        </Card>
      )}
    </DashboardLayout>
  );
}
