'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Check, RotateCcw, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SelectField, TextareaField } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState, SkeletonRows, EmptyState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { adminService } from '@/services/adminService';
import { refName } from '@/lib/statusMeta';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  APPROVED: 'success', PENDING: 'warning', SUSPENDED: 'danger', REJECTED: 'danger',
};

function ApproveDialog({ servantId, servantName, onClose }: { servantId: string; servantName: string; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [municipalityId, setMunicipalityId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [wards, setWards] = useState<string[]>([]);

  const munisQ = useQuery({ queryKey: ['admin', 'municipalities'], queryFn: adminService.listMunicipalities });
  const deptsQ = useQuery({ queryKey: ['admin', 'departments', municipalityId], queryFn: () => adminService.listDepartments(municipalityId), enabled: !!municipalityId });
  const wardOptions = munisQ.data?.find((m) => m._id === municipalityId)?.wards ?? [];

  const approve = useMutation({
    mutationFn: () => adminService.approveServant(servantId, { municipalityId, departmentId, jurisdictionWards: wards }),
    onSuccess: () => { toast.push(`${servantName} approved.`); qc.invalidateQueries({ queryKey: ['admin', 'servants'] }); onClose(); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="relative w-full max-w-md space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Approve {servantName}</h2>
          <button onClick={onClose} aria-label="Close"><X className="h-4 w-4 text-muted" /></button>
        </div>
        <p className="text-sm text-muted">Assign the municipality, department and (optionally) specific wards this servant is authorized for. This defines what they can see and act on.</p>
        <SelectField label="Municipality" value={municipalityId} onChange={(e) => { setMunicipalityId(e.target.value); setDepartmentId(''); setWards([]); }}>
          <option value="">Select…</option>
          {munisQ.data?.map((m) => <option key={m._id} value={m._id}>{m.name}{m.city ? ` — ${m.city}` : ''}</option>)}
        </SelectField>
        <SelectField label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!municipalityId}>
          <option value="">Select…</option>
          {deptsQ.data?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </SelectField>
        {!!wardOptions.length && (
          <div>
            <p className="mb-1.5 text-sm font-medium">Wards (leave empty for the whole municipality)</p>
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded border border-line p-2">
              {wardOptions.map((w) => (
                <button
                  key={w} type="button"
                  onClick={() => setWards((cur) => cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w])}
                  className={`rounded-full px-2.5 py-1 text-xs ${wards.includes(w) ? 'bg-primary text-primary-fg' : 'bg-sunken text-muted'}`}
                >{w}</button>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!municipalityId || !departmentId} loading={approve.isPending} onClick={() => approve.mutate()}>Approve</Button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminServantsPage() {
  const [status, setStatus] = useState('PENDING');
  const [approveTarget, setApproveTarget] = useState<{ id: string; name: string } | null>(null);
  const [reject, setReject] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState('');
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string; action: 'suspend' | 'reactivate' } | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'servants', status],
    queryFn: () => adminService.listServants({ status: status || undefined, limit: 50 }),
  });

  const rejectMut = useMutation({
    mutationFn: () => adminService.rejectServant(reject!.id, reason || undefined),
    onSuccess: () => { toast.push(`${reject!.name} rejected.`); qc.invalidateQueries({ queryKey: ['admin', 'servants'] }); setReject(null); setReason(''); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const suspendMut = useMutation({
    mutationFn: () => suspendTarget!.action === 'suspend' ? adminService.suspendServant(suspendTarget!.id) : adminService.reactivateServant(suspendTarget!.id),
    onSuccess: () => { toast.push(suspendTarget!.action === 'suspend' ? 'Suspended.' : 'Reactivated.'); qc.invalidateQueries({ queryKey: ['admin', 'servants'] }); setSuspendTarget(null); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  return (
    <DashboardLayout roles={['ADMIN']} title="Public servants">
      {() => (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', ''].map((s) => (
              <button key={s || 'all'} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-sm ${status === s ? 'bg-primary text-primary-fg' : 'bg-sunken text-muted'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {isLoading && <SkeletonRows rows={5} />}
          {isError && <ErrorState message="We could not load public servants." onRetry={() => refetch()} />}
          {!isLoading && !isError && !data?.servants.length && <EmptyState title="No public servants here" />}

          <div className="space-y-2">
            {data?.servants.map((s) => (
              <Card key={s._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{s.fullName} <Badge tone={STATUS_TONE[s.accountStatus] ?? 'neutral'}>{s.accountStatus}</Badge></p>
                  <p className="text-sm text-muted">{s.email} · {s.department ?? 'No department stated'} {s.designation ? `· ${s.designation}` : ''}</p>
                  {s.accountStatus === 'APPROVED' && <p className="mt-0.5 text-xs text-muted">{refName(s.municipalityId, 'No municipality')} · {refName(s.departmentId, 'No department')}{s.jurisdictionWards?.length ? ` · ${s.jurisdictionWards.join(', ')}` : ''}</p>}
                </div>
                <div className="flex gap-2">
                  {s.accountStatus === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={() => setApproveTarget({ id: s._id, name: s.fullName })}><Check className="h-3.5 w-3.5" />Approve</Button>
                      <Button variant="danger" size="sm" onClick={() => setReject({ id: s._id, name: s.fullName })}><X className="h-3.5 w-3.5" />Reject</Button>
                    </>
                  )}
                  {s.accountStatus === 'APPROVED' && (
                    <Button variant="secondary" size="sm" onClick={() => setSuspendTarget({ id: s._id, name: s.fullName, action: 'suspend' })}><Ban className="h-3.5 w-3.5" />Suspend</Button>
                  )}
                  {s.accountStatus === 'SUSPENDED' && (
                    <Button variant="secondary" size="sm" onClick={() => setSuspendTarget({ id: s._id, name: s.fullName, action: 'reactivate' })}><RotateCcw className="h-3.5 w-3.5" />Reactivate</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {approveTarget && <ApproveDialog servantId={approveTarget.id} servantName={approveTarget.name} onClose={() => setApproveTarget(null)} />}

          {reject && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setReject(null)} />
              <Card className="relative w-full max-w-sm space-y-3 p-5">
                <h2 className="font-semibold">Reject {reject.name}?</h2>
                <TextareaField label="Reason (optional, shown to the applicant)" value={reason} onChange={(e) => setReason(e.target.value)} />
                <div className="flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => setReject(null)}>Cancel</Button><Button variant="danger" size="sm" loading={rejectMut.isPending} onClick={() => rejectMut.mutate()}>Reject</Button></div>
              </Card>
            </div>
          )}

          <ConfirmDialog
            open={!!suspendTarget}
            title={suspendTarget?.action === 'suspend' ? `Suspend ${suspendTarget?.name}?` : `Reactivate ${suspendTarget?.name}?`}
            tone={suspendTarget?.action === 'suspend' ? 'danger' : 'primary'}
            confirmLabel={suspendTarget?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
            loading={suspendMut.isPending}
            onConfirm={() => suspendMut.mutate()}
            onCancel={() => setSuspendTarget(null)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
