'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { ErrorState, SkeletonRows, EmptyState } from '@/components/ui/States';
import { StatusBadge } from '@/features/issues/Badges';
import { PriorityReasons } from '@/features/issues/PriorityReasons';
import { staffService } from '@/services/staffService';
import { timeAgo } from '@/lib/statusMeta';

export default function PriorityQueuePage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['servant', 'priority-queue'], queryFn: () => staffService.priorityQueue(100) });

  return (
    <DashboardLayout roles={['PUBLIC_SERVANT']} title="Priority queue">
      {() => (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Issues in your jurisdiction, ordered by a transparent priority score. The score combines community support, category
            severity, how long the issue has gone unresolved, likely affected citizens, and current status — never upvotes alone.
          </p>

          {isLoading && <SkeletonRows rows={6} />}
          {isError && <ErrorState message="We could not load the priority queue." onRetry={() => refetch()} />}
          {!isLoading && !isError && !data?.length && <EmptyState title="Queue is empty" description="No open issues in your jurisdiction right now." action={<Flag className="h-5 w-5 text-muted" />} />}

          <div className="space-y-3">
            {data?.map((issue) => (
              <Card key={issue.id} className="p-4">
                <Link href={`/public-servant/issues/${issue.id}`} className="block">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{issue.category}</p>
                      <p className="truncate text-sm text-muted">{issue.description}</p>
                    </div>
                    <StatusBadge status={issue.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{issue.location.address ?? 'Location on file'} · Reported {timeAgo(issue.createdAt)} · {issue.upvotes} upvotes</p>
                  <div className="mt-3"><PriorityReasons priority={issue.priority} reasons={issue.priorityReasons} score={issue.priorityScore} /></div>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
