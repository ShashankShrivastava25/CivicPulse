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

function CreateDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState('OTHER');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [wardsText, setWardsText] = useState('');

  const create = useMutation({
    mutationFn: () => adminService.createMunicipality({ name, type: type as any, city, state, wards: wardsText.split(',').map((w) => w.trim()).filter(Boolean) }),
    onSuccess: () => { toast.push('Municipality created.'); qc.invalidateQueries({ queryKey: ['admin', 'municipalities'] }); onClose(); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="relative w-full max-w-md space-y-3 p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">New municipality</h2><button onClick={onClose} aria-label="Close"><X className="h-4 w-4 text-muted" /></button></div>
        <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="NAGAR_NIGAM">Nagar Nigam</option><option value="NAGAR_PALIKA">Nagar Palika</option>
          <option value="NAGAR_PANCHAYAT">Nagar Panchayat</option><option value="OTHER">Other</option>
        </SelectField>
        <div className="grid grid-cols-2 gap-3"><Field label="City" value={city} onChange={(e) => setCity(e.target.value)} /><Field label="State" value={state} onChange={(e) => setState(e.target.value)} /></div>
        <Field label="Wards (comma-separated)" placeholder="Ward 1, Ward 2, Ward 3" value={wardsText} onChange={(e) => setWardsText(e.target.value)} />
        <div className="flex justify-end gap-2 pt-1"><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" disabled={!name} loading={create.isPending} onClick={() => create.mutate()}>Create</Button></div>
      </Card>
    </div>
  );
}

export default function MunicipalitiesPage() {
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState<{ id: string; name: string } | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'municipalities'], queryFn: adminService.listMunicipalities });

  const deactivate = useMutation({
    mutationFn: () => adminService.deactivateMunicipality(deactivating!.id),
    onSuccess: () => { toast.push('Municipality deactivated.'); qc.invalidateQueries({ queryKey: ['admin', 'municipalities'] }); setDeactivating(null); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  return (
    <DashboardLayout roles={['ADMIN']} title="Municipalities">
      {() => (
        <div className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />New municipality</Button></div>

          {isLoading && <SkeletonRows rows={4} />}
          {isError && <ErrorState message="We could not load municipalities." onRetry={() => refetch()} />}
          {!isLoading && !isError && !data?.length && <EmptyState title="No municipalities yet" description="Create one to start approving public servants." />}

          <div className="grid gap-3 sm:grid-cols-2">
            {data?.map((m) => (
              <Card key={m._id} className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <div><p className="font-medium">{m.name}</p><p className="text-xs text-muted">{m.city}{m.city && m.state ? ', ' : ''}{m.state}</p></div>
                  <Badge tone={m.status === 'ACTIVE' ? 'success' : 'neutral'}>{m.status}</Badge>
                </div>
                <p className="text-xs text-muted">{m.wards.length} wards · {m.departmentCount ?? 0} departments</p>
                {m.status === 'ACTIVE' && (
                  <Button variant="secondary" size="sm" onClick={() => setDeactivating({ id: m._id, name: m.name })}><PowerOff className="h-3.5 w-3.5" />Deactivate</Button>
                )}
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
