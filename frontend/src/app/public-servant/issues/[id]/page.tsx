'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardEdit, MapPin, MessageSquare, UserPlus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SelectField, TextareaField } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/features/issues/Badges';
import { PriorityReasons } from '@/features/issues/PriorityReasons';
import { Timeline } from '@/features/issues/Timeline';
import { staffService } from '@/services/staffService';
import { refName } from '@/lib/statusMeta';
import type { IssueStatus } from '@/types';

const NEXT_STATUSES: IssueStatus[] = ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'REJECTED'];

export default function ServantIssueDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: issue, isLoading, isError, refetch } = useQuery({ queryKey: ['servant', 'issue', id], queryFn: () => staffService.getIssue(id) });

  const [updateMsg, setUpdateMsg] = useState('');
  const [updateVisibility, setUpdateVisibility] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');
  const [nextStatus, setNextStatus] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [confirmResolve, setConfirmResolve] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['servant', 'issue', id] });
    qc.invalidateQueries({ queryKey: ['servant', 'dashboard'] });
    qc.invalidateQueries({ queryKey: ['servant', 'issues'] });
    qc.invalidateQueries({ queryKey: ['servant', 'priority-queue'] });
  };

  const acceptMut = useMutation({
    mutationFn: () => staffService.accept(id),
    onSuccess: () => { toast.push('Issue accepted and assigned to you.'); invalidate(); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const statusMut = useMutation({
    mutationFn: () => staffService.changeStatus(id, nextStatus),
    onSuccess: () => { toast.push('Status updated.'); setNextStatus(''); invalidate(); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const updateMut = useMutation({
    mutationFn: () => staffService.addUpdate(id, { message: updateMsg, visibility: updateVisibility }),
    onSuccess: () => { toast.push(updateVisibility === 'INTERNAL' ? 'Internal note added.' : 'Update posted.'); setUpdateMsg(''); invalidate(); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const resolveMut = useMutation({
    mutationFn: () => staffService.resolve(id, { resolutionNotes: resolveNotes, confirmed: true }),
    onSuccess: () => { toast.push('Issue marked resolved.'); setConfirmResolve(false); setResolveNotes(''); invalidate(); },
    onError: (e: Error) => { toast.push(e.message, 'error'); setConfirmResolve(false); },
  });

  return (
    <DashboardLayout roles={['PUBLIC_SERVANT']} title="Issue details">
      {() => {
        if (isLoading) return <LoadingState label="Loading issue…" />;
        if (isError || !issue) return <ErrorState message="We could not load this issue." onRetry={() => refetch()} />;

        const canAct = issue.status !== 'RESOLVED' && issue.status !== 'REJECTED';

        return (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h1 className="text-lg font-semibold">{issue.category}</h1>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="h-3.5 w-3.5" aria-hidden />{issue.location.address ?? `${issue.location.latitude.toFixed(5)}, ${issue.location.longitude.toFixed(5)}`}</p>
                  </div>
                  <StatusBadge status={issue.status} />
                </div>
                {issue.imageUrl && <img src={issue.imageUrl} alt="" className="mt-4 max-h-72 w-full rounded-lg object-cover" />}
                <p className="mt-4 whitespace-pre-wrap text-sm">{issue.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs text-muted">Reporter</dt><dd>{refName(issue.reporter, 'Citizen')}</dd></div>
                  <div><dt className="text-xs text-muted">Assigned to</dt><dd>{refName(issue.assignedTo)}</dd></div>
                  <div><dt className="text-xs text-muted">Upvotes</dt><dd>{issue.upvotes}</dd></div>
                </dl>
              </Card>

              <Card className="p-5">
                <h2 className="mb-3 flex items-center gap-2 font-semibold"><MessageSquare className="h-4 w-4 text-primary" aria-hidden />Timeline</h2>
                <Timeline entries={issue.timeline} />
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-5"><PriorityReasons priority={issue.priority} reasons={issue.priorityReasons} score={issue.priorityScore} /></Card>

              {!issue.assignedTo && canAct && (
                <Card className="p-5">
                  <Button className="w-full" onClick={() => acceptMut.mutate()} loading={acceptMut.isPending}><UserPlus className="h-4 w-4" />Accept &amp; assign to me</Button>
                </Card>
              )}

              {canAct && (
                <Card className="space-y-3 p-5">
                  <h2 className="flex items-center gap-2 font-semibold"><ClipboardEdit className="h-4 w-4 text-primary" aria-hidden />Change status</h2>
                  <SelectField label="New status" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                    <option value="">Select…</option>
                    {NEXT_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </SelectField>
                  <Button variant="secondary" className="w-full" disabled={!nextStatus} loading={statusMut.isPending} onClick={() => statusMut.mutate()}>Update status</Button>
                </Card>
              )}

              {canAct && (
                <Card className="space-y-3 p-5">
                  <h2 className="font-semibold">Add update</h2>
                  <TextareaField label="Message" placeholder="e.g. Inspection completed. Cleaning team has been assigned." value={updateMsg} onChange={(e) => setUpdateMsg(e.target.value)} />
                  <SelectField label="Visibility" value={updateVisibility} onChange={(e) => setUpdateVisibility(e.target.value as 'PUBLIC' | 'INTERNAL')}>
                    <option value="PUBLIC">Public update (citizen sees this)</option>
                    <option value="INTERNAL">Internal note (staff only)</option>
                  </SelectField>
                  <Button className="w-full" disabled={updateMsg.trim().length < 3} loading={updateMut.isPending} onClick={() => updateMut.mutate()}>Post update</Button>
                </Card>
              )}

              {canAct && (
                <Card className="space-y-3 p-5">
                  <h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-success" aria-hidden />Resolve issue</h2>
                  <TextareaField label="Action taken" placeholder="e.g. Drainage cleaning has been completed." value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} />
                  <Button variant="primary" className="w-full" disabled={resolveNotes.trim().length < 3} onClick={() => setConfirmResolve(true)}>Mark resolved</Button>
                </Card>
              )}
            </div>

            <ConfirmDialog
              open={confirmResolve}
              title="Are you sure this issue has been resolved?"
              description="The citizen will be notified immediately. This action can't be undone."
              confirmLabel="Yes, mark resolved"
              loading={resolveMut.isPending}
              onConfirm={() => resolveMut.mutate()}
              onCancel={() => setConfirmResolve(false)}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
