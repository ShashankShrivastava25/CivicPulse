'use client';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { SelectField } from '@/components/ui/Field';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { adminService } from '@/services/adminService';
import { CATEGORIES } from '@/lib/statusMeta';

const IssueMap = dynamic(() => import('@/components/map/IssueMap'), { ssr: false, loading: () => <div className="h-[560px] animate-pulse rounded-lg bg-sunken" /> });

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

export default function AdminMapPage() {
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'map', status, category],
    queryFn: () => adminService.listIssues({ limit: 150, status: status || undefined, category: category || undefined }),
  });

  const center = useMemo<[number, number]>(() => {
    const first = data?.issues[0] as any;
    return first ? [first.latitude, first.longitude] : DEFAULT_CENTER;
  }, [data]);

  return (
    <DashboardLayout roles={['ADMIN']} title="Map">
      {() => (
        <div className="space-y-4">
          <Card className="grid gap-3 p-4 sm:grid-cols-3">
            <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {['REPORTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </SelectField>
            <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
          </Card>

          {isLoading && <LoadingState label="Loading map…" />}
          {isError && <ErrorState message="We could not load the map." onRetry={() => refetch()} />}
          {data && (
            <IssueMap
              center={center}
              zoom={12}
              issues={(data.issues as any[]).map((i) => ({ id: i.id, category: i.category, description: i.description, status: i.status, upvotes: i.upvoteCount ?? i.upvotes, imageUrl: i.imageUrl, latitude: i.latitude, longitude: i.longitude }))}
              issueHref={(id) => `/admin/issues/${id}`}
              height={560}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
