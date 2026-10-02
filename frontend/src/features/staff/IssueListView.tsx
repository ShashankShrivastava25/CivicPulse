'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Field, SelectField } from '@/components/ui/Field';
import { ErrorState, SkeletonRows, EmptyState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge, PriorityBadge } from '@/features/issues/Badges';
import { staffService, type IssueFilters } from '@/services/staffService';
import { CATEGORIES, timeAgo } from '@/lib/statusMeta';
import type { IssueStatus } from '@/types';

const STATUS_OPTIONS: IssueStatus[] = ['REPORTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

/** Shared list used for All / Assigned / In Progress / Resolved — server-side filtering + pagination. */
export function IssueListView({ baseFilters, emptyLabel }: { baseFilters: IssueFilters; emptyLabel: string }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');

  const filters: IssueFilters = { ...baseFilters, page, limit: 20, q: q || undefined, status: status || baseFilters.status, category: category || undefined, priority: priority || undefined };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['servant', 'issues', filters],
    queryFn: () => staffService.listIssues(filters),
  });

  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-muted" aria-hidden />
          <Field label="Search" placeholder="Description, category, address…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="[&_input]:pl-9" />
        </div>
        {!baseFilters.status && (
          <SelectField label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </SelectField>
        )}
        <SelectField label="Priority" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
          <option value="">All priorities</option>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => <option key={p} value={p}>{p}</option>)}
        </SelectField>
        <SelectField label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
      </Card>

      {isLoading && <SkeletonRows rows={6} />}
      {isError && <ErrorState message="We could not load issues." onRetry={() => refetch()} />}
      {!isLoading && !isError && !data?.issues.length && <EmptyState title={`No issues to show`} description={emptyLabel} />}

      <div className="space-y-2">
        {data?.issues.map((issue) => (
          <Link key={issue.id} href={`/public-servant/issues/${issue.id}`}>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-sunken/60">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{issue.category}</p>
                <p className="truncate text-sm text-muted">{issue.description}</p>
                <p className="mt-1 text-xs text-muted">{issue.location.address ?? 'Location on file'} · {timeAgo(issue.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <PriorityBadge priority={issue.priority} />
                <StatusBadge status={issue.status} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {data?.pagination && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />}
    </div>
  );
}
