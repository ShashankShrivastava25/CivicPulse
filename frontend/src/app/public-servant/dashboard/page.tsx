'use client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ClipboardList, Eye, Flag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState, SkeletonGrid, SkeletonRows, EmptyState } from '@/components/ui/States';
import { ApprovalBanner } from '@/features/dashboard/PendingBanner';
import { StatCard, StatCardGrid } from '@/features/dashboard/StatCard';
import { StatusBadge, PriorityBadge } from '@/features/issues/Badges';
import { staffService } from '@/services/staffService';

export default function ServantDashboard() {
  const stats = useQuery({ queryKey: ['servant', 'dashboard'], queryFn: staffService.dashboard });
  const queue = useQuery({ queryKey: ['servant', 'priority-queue', 'preview'], queryFn: () => staffService.priorityQueue(5) });

  return (
    <DashboardLayout roles={['PUBLIC_SERVANT']} title="Dashboard">
      {(user) => (
        <div className="space-y-8">
          <ApprovalBanner user={user} />

          {stats.isLoading && <SkeletonGrid items={6} />}
          {stats.isError && <ErrorState message="We could not load your stats." onRetry={() => stats.refetch()} />}
          {stats.data && (
            <StatCardGrid>
              <StatCard label="Total assigned" value={stats.data.totalAssigned} icon={ClipboardList} />
              <StatCard label="Pending" value={stats.data.pending} />
              <StatCard label="Under review" value={stats.data.underReview} />
              <StatCard label="In progress" value={stats.data.inProgress} icon={Loader2} />
              <StatCard label="Resolved" value={stats.data.resolved} icon={CheckCircle2} tone="success" />
              <StatCard label="High priority" value={stats.data.highPriority} icon={AlertTriangle} tone="danger" />
            </StatCardGrid>
          )}

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><Flag className="h-4 w-4 text-primary" aria-hidden />Top of your priority queue</h2>
              <Button href="/public-servant/priority-queue" variant="secondary" size="sm">View full queue</Button>
            </div>
            {queue.isLoading && <SkeletonRows rows={4} />}
            {!queue.isLoading && !queue.data?.length && <EmptyState title="Nothing urgent right now" description="New reports in your jurisdiction will show up here, ranked by priority." />}
            <div className="divide-y divide-line">
              {queue.data?.map((i) => (
                <Link key={i.id} href={`/public-servant/issues/${i.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-sunken/60">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{i.category}</p>
                    <p className="truncate text-xs text-muted">{i.location.address ?? `${i.location.latitude.toFixed(4)}, ${i.location.longitude.toFixed(4)}`}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={i.priority} />
                    <StatusBadge status={i.status} />
                    <Eye className="h-4 w-4 text-muted" aria-hidden />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
