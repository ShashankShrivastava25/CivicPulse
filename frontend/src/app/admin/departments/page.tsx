'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, PowerOff, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, SelectField } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState, SkeletonRows, EmptyState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { adminService } from '@/services/adminService';
import { CATEGORIES, refName } from '@/lib/statusMeta';

function CreateDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const munisQ = useQuery({ queryKey: ['admin', 'municipalities'], queryFn: adminService.listMunicipalities });
  const [name, setName] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const create = useMutation({
    mutationFn: () => adminService.createDepartment({ name, municipality, categories }),
    onSuccess: () => { toast.push('Department created.'); qc.invalidateQueries({ queryKey: ['admin', 'departments'] }); onClose(); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="relative w-full max-w-md space-y-3 p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">New department</h2><button onClick={onClose} aria-label="Close"><X className="h-4 w-4 text-muted" /></button></div>
        <Field label="Name" placeholder="e.g. Sanitation" value={name} onChange={(e) => setName(e.target.value)} />
        <SelectField label="Municipality" value={municipality} onChange={(e) => setMunicipality(e.target.value)}>
          <option value="">Select…</option>{munisQ.data?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
        </SelectField>
        <div>
          <p className="mb-1.5 text-sm font-medium">Handles categories</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCategories((cur) => cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c])} className={`rounded-full px-2.5 py-1 text-xs ${categories.includes(c) ? 'bg-primary text-primary-fg' : 'bg-sunken text-muted'}`}>{c}</button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1"><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" disabled={!name || !municipality} loading={create.isPending} onClick={() => create.mutate()}>Create</Button></div>
      </Card>
    </div>
  );
}

export default function DepartmentsPage() {
  const [creating, setCreating] = useState(false);
  const [municipalityFilter, setMunicipalityFilter] = useState('');
  const [deactivating, setDeactivating] = useState<{ id: string; name: string } | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const munisQ = useQuery({ queryKey: ['admin', 'municipalities'], queryFn: adminService.listMunicipalities });
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'departments', municipalityFilter], queryFn: () => adminService.listDepartments(municipalityFilter || undefined) });

  const deactivate = useMutation({
    mutationFn: () => adminService.deactivateDepartment(deactivating!.id),
    onSuccess: () => { toast.push('Department deactivated.'); qc.invalidateQueries({ queryKey: ['admin', 'departments'] }); setDeactivating(null); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  return (
    <DashboardLayout roles={['ADMIN']} title="Departments">
      {() => (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <SelectField label="Filter by municipality" value={municipalityFilter} onChange={(e) => setMunicipalityFilter(e.target.value)} className="w-64">
              <option value="">All municipalities</option>{munisQ.data?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </SelectField>
            <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />New department</Button>
          </div>

          {isLoading && <SkeletonRows rows={4} />}
          {isError && <ErrorState message="We could not load departments." onRetry={() => refetch()} />}
          {!isLoading && !isError && !data?.length && <EmptyState title="No departments yet" />}

          <div className="grid gap-3 sm:grid-cols-2">
            {data?.map((d) => (
              <Card key={d._id} className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <div><p className="font-medium">{d.name}</p><p className="text-xs text-muted">{refName(d.municipality)}</p></div>
                  <Badge tone={d.status === 'ACTIVE' ? 'success' : 'neutral'}>{d.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">{d.categories.map((c) => <Badge key={c} tone="neutral">{c}</Badge>)}</div>
                {d.status === 'ACTIVE' && <Button variant="secondary" size="sm" onClick={() => setDeactivating({ id: d._id, name: d.name })}><PowerOff className="h-3.5 w-3.5" />Deactivate</Button>}
              </Card>
            ))}
          </div>

          {creating && <CreateDialog onClose={() => setCreating(false)} />}
          <ConfirmDialog open={!!deactivating} title={`Deactivate ${deactivating?.name}?`} tone="danger" confirmLabel="Deactivate" loading={deactivate.isPending} onConfirm={() => deactivate.mutate()} onCancel={() => setDeactivating(null)} />
        </div>
      )}
    </DashboardLayout>
  );
}
