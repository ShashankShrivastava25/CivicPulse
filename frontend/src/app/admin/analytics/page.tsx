'use client';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { ErrorState, SkeletonGrid } from '@/components/ui/States';
import { StatCard, StatCardGrid } from '@/features/dashboard/StatCard';
import { adminService } from '@/services/adminService';

const PRIORITY_COLORS: Record<string, string> = { LOW: '#94a3b8', MEDIUM: '#38bdf8', HIGH: '#f59e0b', CRITICAL: '#ef4444' };

export default function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'analytics', 'full'], queryFn: () => adminService.analytics() });
  const dupQ = useQuery({ queryKey: ['admin', 'duplicate-analytics'], queryFn: adminService.duplicateAnalytics });

  return (
    <DashboardLayout roles={['ADMIN']} title="Analytics">
      {() => (
        <div className="space-y-6">
          {isLoading && <SkeletonGrid items={5} />}
          {isError && <ErrorState message="We could not load analytics." onRetry={() => refetch()} />}
          {data && (
            <StatCardGrid>
              <StatCard label="Total reports" value={data.totalReports} />
              <StatCard label="Open" value={data.openReports} />
              <StatCard label="In progress" value={data.inProgress} />
              <StatCard label="Resolved" value={data.resolved} tone="success" />
              <StatCard label="Avg. resolution time" value={data.averageResolutionHours != null ? `${data.averageResolutionHours}h` : '—'} />
            </StatCardGrid>
          )}

          {data && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <h2 className="mb-3 font-semibold">Reports over time</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.reportsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="rgb(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5">
                <h2 className="mb-3 font-semibold">Priority distribution</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Tooltip />
                    <Pie data={data.byPriority} dataKey="count" nameKey="priority" outerRadius={90} label>
                      {data.byPriority.map((p) => <Cell key={p.priority} fill={PRIORITY_COLORS[p.priority] ?? '#94a3b8'} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5">
                <h2 className="mb-3 font-semibold">Reports by category</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.byCategory} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="rgb(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5">
                <h2 className="mb-3 font-semibold">Reports by municipality</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.byMunicipality} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="municipality" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="rgb(var(--accent))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Duplicate detection</h2>
            <p className="mb-4 text-xs text-muted">The AI/heuristic system only ever suggests a possible duplicate — a citizen always decides whether to confirm it.</p>
            {dupQ.data && (
              <StatCardGrid>
                <StatCard label="AI-suggested duplicates" value={dupQ.data.aiSuggestedDuplicates} />
                <StatCard label="Citizen-confirmed duplicates" value={dupQ.data.citizenConfirmedDuplicates} tone="success" />
                <StatCard label="Citizen-rejected suggestions" value={dupQ.data.citizenRejectedSuggestions} />
                <StatCard label="Reports likely prevented" value={dupQ.data.duplicateReportsPrevented} />
              </StatCardGrid>
            )}
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
