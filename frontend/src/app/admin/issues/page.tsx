'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Field, SelectField } from '@/components/ui/Field';
import { ErrorState, SkeletonRows, EmptyState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge, PriorityBadge } from '@/features/issues/Badges';
import { adminService } from '@/services/adminService';
import { CATEGORIES, timeAgo, refName } from '@/lib/statusMeta';

const STATUSES = ['REPORTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export default function AdminIssuesPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'issues', page, q, status, priority, category],
    queryFn: () => adminService.listIssues({ page, limit: 20, q: q || undefined, status: status || undefined, priority: priority || undefined, category: category || undefined }),
  });

  return (
    <DashboardLayout roles={['ADMIN']} title="Issues">
      {() => (
        <div className="space-y-4">
          <Card className="grid gap-3 p-4 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-muted" aria-hidden />
              <Field label="Search" placeholder="Description, category, address…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="[&_input]:pl-9" />
            </div>
            <SelectField label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </SelectField>
            <SelectField label="Priority" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
              <option value="">All priorities</option>{['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => <option key={p} value={p}>{p}</option>)}
            </SelectField>
            <SelectField label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="sm:col-span-4 lg:col-span-1">
              <option value="">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
          </Card>

          {isLoading && <SkeletonRows rows={6} />}
          {isError && <ErrorState message="We could not load issues." onRetry={() => refetch()} />}
          {!isLoading && !isError && !data?.issues.length && <EmptyState title="No issues match your filters" />}

          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-muted"><tr>
                <th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Reporter</th>
                <th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Assigned</th><th className="px-4 py-3 font-medium">Reported</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {data?.issues.map((i) => (
                  <tr key={i.id} className="cursor-pointer hover:bg-sunken/60">
                    <td className="px-4 py-3"><Link href={`/admin/issues/${i.id}`} className="font-medium hover:underline">{i.category}</Link><p className="max-w-xs truncate text-xs text-muted">{i.description}</p></td>
                    <td className="px-4 py-3 text-muted">{refName(i.reporterId, '—')}</td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={i.priority} /></td>
                    <td className="px-4 py-3 text-muted">{refName(i.assignedTo)}</td>
                    <td className="px-4 py-3 text-muted">{timeAgo(i.createdAt)}</td>
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
