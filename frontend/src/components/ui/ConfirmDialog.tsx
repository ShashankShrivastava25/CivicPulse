'use client';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A blocking confirmation dialog for destructive or irreversible actions (approve/reject/suspend/resolve, etc). */
export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', tone = 'primary', loading, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="relative w-full max-w-sm rounded-lg border border-line bg-surface p-5 shadow-pop">
        <div className="flex items-start gap-3">
          {tone === 'danger' && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />}
          <div>
            <h2 id="confirm-title" className="font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} size="sm" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
