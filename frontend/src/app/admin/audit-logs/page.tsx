'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, Badge } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { ErrorState, SkeletonRows, EmptyState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { adminService } from '@/services/adminService';
import { formatDateTime, refName } from '@/lib/statusMeta';

const ACTION_TONE = (a: string): 'danger' | 'warning' | 'success' | 'neutral' => {
  if (a.includes('REJECTED') || a.includes('SUSPENDED') || a.includes('HIDDEN')) return 'danger';
  if (a.includes('APPROVED') || a.includes('RESOLVED') || a.includes('REACTIVATED')) return 'success';
  if (a.includes('CHANGED') || a.includes('UPDATED') || a.includes('MODERATED')) return 'warning';
  return 'neutral';
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'audit-logs', page, action],
    queryFn: () => adminService.auditLogs({ page, limit: 30, action: action || undefined }),
  });

  return (
    <DashboardLayout roles={['ADMIN']} title="Audit logs">
      {() => (
        <div className="space-y-4">
          <Card className="p-4"><Field label="Filter by action" placeholder="e.g. SERVANT_APPROVED" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} /></Card>

          {isLoading && <SkeletonRows rows={8} />}
          {isError && <ErrorState message="We could not load audit logs." onRetry={() => refetch()} />}
          {!isLoading && !isError && !data?.logs.length && <EmptyState title="No audit events found" />}

          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-muted"><tr>
                <th className="px-4 py-3 font-medium">When</th><th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th><th className="px-4 py-3 font-medium">Target</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {data?.logs.map((l) => (
                  <tr key={l._id}>
                    <td className="px-4 py-3 text-muted">{formatDateTime(l.timestamp)}</td>
                    <td className="px-4 py-3">{refName(l.actorId, 'System')} <span className="text-xs text-muted">({l.actorRole})</span></td>
                    <td className="px-4 py-3"><Badge tone={ACTION_TONE(l.action)}>{l.action.replaceAll('_', ' ')}</Badge></td>
                    <td className="px-4 py-3 text-muted">{l.targetType ? `${l.targetType} · ${l.targetId?.slice(-6)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {data?.pagination && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />}
        </div>
      )}
    </DashboardLayout>
  );
}
