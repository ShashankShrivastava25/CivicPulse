'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, RotateCcw, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, SelectField } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState, SkeletonRows, EmptyState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { adminService } from '@/services/adminService';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success', APPROVED: 'success', PENDING: 'warning', SUSPENDED: 'danger', REJECTED: 'danger',
};

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [confirm, setConfirm] = useState<{ id: string; name: string; action: 'suspend' | 'reactivate' } | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users', page, q, role],
    queryFn: () => adminService.listUsers({ page, limit: 20, q: q || undefined, role: role || undefined }),
  });

  const mutate = useMutation({
    mutationFn: () => confirm!.action === 'suspend' ? adminService.suspendUser(confirm!.id) : adminService.reactivateUser(confirm!.id),
    onSuccess: () => { toast.push(confirm!.action === 'suspend' ? 'User suspended.' : 'User reactivated.'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setConfirm(null); },
    onError: (e: Error) => { toast.push(e.message, 'error'); setConfirm(null); },
  });

  return (
    <DashboardLayout roles={['ADMIN']} title="Users">
      {() => (
        <div className="space-y-4">
          <Card className="grid gap-3 p-4 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-muted" aria-hidden />
              <Field label="Search" placeholder="Name or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="[&_input]:pl-9" />
            </div>
            <SelectField label="Role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
              <option value="">All roles</option>
              <option value="CITIZEN">Citizen</option>
              <option value="PUBLIC_SERVANT">Public servant</option>
              <option value="ADMIN">Admin</option>
            </SelectField>
          </Card>

          {isLoading && <SkeletonRows rows={6} />}
          {isError && <ErrorState message="We could not load users." onRetry={() => refetch()} />}
          {!isLoading && !isError && !data?.users.length && <EmptyState title="No users found" />}

          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-muted"><tr>
                <th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {data?.users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 font-medium">{u.fullName}</td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3">{u.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3"><Badge tone={STATUS_TONE[u.accountStatus] ?? 'neutral'}>{u.accountStatus}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {u.accountStatus === 'SUSPENDED' ? (
                        <Button variant="secondary" size="sm" onClick={() => setConfirm({ id: u._id, name: u.fullName, action: 'reactivate' })}><RotateCcw className="h-3.5 w-3.5" />Reactivate</Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => setConfirm({ id: u._id, name: u.fullName, action: 'suspend' })}><Ban className="h-3.5 w-3.5" />Suspend</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {data?.pagination && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />}

          <ConfirmDialog
            open={!!confirm}
            title={confirm?.action === 'suspend' ? `Suspend ${confirm?.name}?` : `Reactivate ${confirm?.name}?`}
            description={confirm?.action === 'suspend' ? 'They will lose access until reactivated.' : 'They will regain access immediately.'}
            tone={confirm?.action === 'suspend' ? 'danger' : 'primary'}
            confirmLabel={confirm?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
            loading={mutate.isPending}
            onConfirm={() => mutate.mutate()}
            onCancel={() => setConfirm(null)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
