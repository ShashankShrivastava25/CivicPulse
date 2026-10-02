'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertTriangle, Building2, CheckCircle2, ClipboardList, Landmark, ScrollText, UserCheck, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { StatCard, StatCardGrid } from '@/features/dashboard/StatCard';
import { ErrorState, SkeletonGrid } from '@/components/ui/States';
import { adminService } from '@/services/adminService';

const SHORTCUTS = [
  { label: 'Approve public servants', href: '/admin/public-servants', icon: UserCheck },
  { label: 'Review all issues', href: '/admin/issues', icon: ClipboardList },
  { label: 'Manage municipalities', href: '/admin/municipalities', icon: Landmark },
  { label: 'Manage departments', href: '/admin/departments', icon: Building2 },
  { label: 'View audit logs', href: '/admin/audit-logs', icon: ScrollText },
  { label: 'Manage users', href: '/admin/users', icon: Users },
];

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'analytics', 'overview'], queryFn: () => adminService.analytics() });
  const servantsQ = useQuery({ queryKey: ['admin', 'servants', 'pending-count'], queryFn: () => adminService.listServants({ status: 'PENDING', limit: 1 }) });

  return (
    <DashboardLayout roles={['ADMIN']} title="Dashboard">
      {() => (
        <div className="space-y-8">
          {isLoading && <SkeletonGrid items={5} />}
          {isError && <ErrorState message="We could not load platform stats." onRetry={() => refetch()} />}
          {data && (
            <StatCardGrid>
              <StatCard label="Total reports" value={data.totalReports} icon={ClipboardList} />
              <StatCard label="Open" value={data.openReports} />
              <StatCard label="In progress" value={data.inProgress} />
              <StatCard label="Resolved" value={data.resolved} icon={CheckCircle2} tone="success" />
              <StatCard label="Pending servant approvals" value={servantsQ.data?.pagination.total ?? 0} icon={AlertTriangle} tone={servantsQ.data?.pagination.total ? 'warning' : 'neutral'} />
            </StatCardGrid>
          )}

          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Quick actions</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SHORTCUTS.map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 rounded-lg border border-line p-4 hover:bg-sunken">
                  <Icon className="h-5 w-5 text-primary" aria-hidden /><span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
