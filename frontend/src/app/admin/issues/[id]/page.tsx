'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Eye, EyeOff, MapPin, Shuffle, ShieldAlert } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, SelectField, TextareaField } from '@/components/ui/Field';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/features/issues/Badges';
import { PriorityReasons } from '@/features/issues/PriorityReasons';
import { Timeline } from '@/features/issues/Timeline';
import { adminService } from '@/services/adminService';
import { refName } from '@/lib/statusMeta';
import type { Priority } from '@/types';

export default function AdminIssueDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'issue', id], queryFn: () => adminService.getIssue(id) });
  const servantsQ = useQuery({ queryKey: ['admin', 'servants', 'approved'], queryFn: () => adminService.listServants({ status: 'APPROVED', limit: 100 }) });

  const [assignTo, setAssignTo] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [priorityReason, setPriorityReason] = useState('');

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['admin', 'issue', id] }); qc.invalidateQueries({ queryKey: ['admin', 'issues'] }); };

  const assignMut = useMutation({
    mutationFn: () => adminService.assignIssue(id, { assignedTo: assignTo }),
    onSuccess: () => { toast.push('Issue assigned.'); setAssignTo(''); invalidate(); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const priorityMut = useMutation({
    mutationFn: () => adminService.changePriority(id, priority, priorityReason || undefined),
    onSuccess: () => { toast.push('Priority updated.'); setPriority(''); setPriorityReason(''); invalidate(); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const moderateMut = useMutation({
    mutationFn: (status: 'VISIBLE' | 'FLAGGED' | 'HIDDEN') => adminService.moderateIssue(id, status),
    onSuccess: (_d, status) => { toast.push(`Moderation set to ${status}.`); invalidate(); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  return (
    <DashboardLayout roles={['ADMIN']} title="Issue details">
      {() => {
        if (isLoading) return <LoadingState label="Loading issue…" />;
        if (isError || !data) return <ErrorState message="We could not load this issue." onRetry={() => refetch()} />;
        const issue = data.issue as any;

        return (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h1 className="text-lg font-semibold">{issue.category}</h1>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="h-3.5 w-3.5" aria-hidden />{issue.location?.address ?? `${issue.latitude}, ${issue.longitude}`}</p>
                  </div>
                  <div className="flex gap-2"><StatusBadge status={issue.status} /><Badge tone={issue.moderationStatus === 'HIDDEN' ? 'danger' : issue.moderationStatus === 'FLAGGED' ? 'warning' : 'neutral'}>{issue.moderationStatus ?? 'VISIBLE'}</Badge></div>
                </div>
                {issue.imageUrl && <img src={issue.imageUrl} alt="" className="mt-4 max-h-72 w-full rounded-lg object-cover" />}
                <p className="mt-4 whitespace-pre-wrap text-sm">{issue.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs text-muted">Reporter</dt><dd>{refName(issue.reporterId, 'Citizen')}</dd></div>
                  <div><dt className="text-xs text-muted">Assigned to</dt><dd>{refName(issue.assignedTo)}</dd></div>
                  <div><dt className="text-xs text-muted">Department</dt><dd>{refName(issue.departmentId)}</dd></div>
                  <div><dt className="text-xs text-muted">Upvotes</dt><dd>{issue.upvoteCount ?? issue.upvotes}</dd></div>
                </dl>
              </Card>

              {!!issue.duplicateCandidates?.length && (
                <Card className="p-5">
                  <h2 className="mb-3 flex items-center gap-2 font-semibold"><Copy className="h-4 w-4 text-primary" aria-hidden />AI-suggested duplicate candidates</h2>
                  <p className="mb-3 text-xs text-muted">These were suggested by the duplicate-detection system, not confirmed by any citizen.</p>
                  <div className="space-y-2">
                    {issue.duplicateCandidates.map((c: any) => (
                      <div key={c.issueId?._id ?? c.issueId} className="flex items-center justify-between rounded border border-line p-2 text-sm">
                        <span>{c.issueId?.category ?? 'Issue'} — {c.issueId?.description?.slice(0, 60)}</span>
                        <Badge tone="info">{Math.round((c.confidence ?? 0) * 100)}% match</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-5">
                <h2 className="mb-3 font-semibold">Timeline</h2>
                <Timeline entries={data.timeline} />
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-5"><PriorityReasons priority={issue.priority} reasons={issue.priorityReasons} score={issue.priorityScore} /></Card>

              <Card className="space-y-3 p-5">
                <h2 className="flex items-center gap-2 font-semibold"><Shuffle className="h-4 w-4 text-primary" aria-hidden />Assign / reassign</h2>
                <SelectField label="Public servant" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                  <option value="">Select…</option>
                  {servantsQ.data?.servants.map((s) => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                </SelectField>
                <Button variant="secondary" className="w-full" disabled={!assignTo} loading={assignMut.isPending} onClick={() => assignMut.mutate()}>Assign</Button>
              </Card>

              <Card className="space-y-3 p-5">
                <h2 className="font-semibold">Override priority</h2>
                <SelectField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  <option value="">Select…</option>{['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => <option key={p} value={p}>{p}</option>)}
                </SelectField>
                <Field label="Reason (optional)" value={priorityReason} onChange={(e) => setPriorityReason(e.target.value)} />
                <Button variant="secondary" className="w-full" disabled={!priority} loading={priorityMut.isPending} onClick={() => priorityMut.mutate()}>Update priority</Button>
              </Card>

              <Card className="space-y-2 p-5">
                <h2 className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-warning" aria-hidden />Moderation</h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" loading={moderateMut.isPending} onClick={() => moderateMut.mutate('VISIBLE')}><Eye className="h-3.5 w-3.5" />Visible</Button>
                  <Button variant="secondary" size="sm" loading={moderateMut.isPending} onClick={() => moderateMut.mutate('FLAGGED')}>Flag</Button>
                  <Button variant="danger" size="sm" loading={moderateMut.isPending} onClick={() => moderateMut.mutate('HIDDEN')}><EyeOff className="h-3.5 w-3.5" />Hide</Button>
                </div>
              </Card>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
