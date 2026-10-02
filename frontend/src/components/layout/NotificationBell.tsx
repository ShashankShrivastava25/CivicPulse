'use client';
import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { timeAgo } from '@/lib/statusMeta';
import { cn } from '@/utils/cn';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: () => notificationService.list(1, 8),
    refetchInterval: 30_000,
  });

  const unread = data?.unreadCount ?? 0;

  const markAllRead = async () => {
    await notificationService.markAllRead();
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-sunken"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div role="menu" onMouseLeave={() => setOpen(false)} className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-line bg-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-sm font-medium">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <CheckCheck className="h-3.5 w-3.5" />Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!data?.notifications.length && <p className="px-3 py-6 text-center text-sm text-muted">You&apos;re all caught up.</p>}
            {data?.notifications.map((n) => (
              <div key={n._id} className={cn('border-b border-line px-3 py-2.5 last:border-0', !n.read && 'bg-primary-soft/40')}>
                <p className="text-sm">{n.message}</p>
                <p className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</p>
              </div>
            ))}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-3 py-2 text-center text-xs font-medium text-primary hover:bg-sunken">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
