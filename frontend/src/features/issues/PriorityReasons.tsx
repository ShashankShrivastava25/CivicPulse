import { Info } from 'lucide-react';
import { PriorityBadge } from './Badges';
import type { Priority } from '@/types';

/**
 * Shows a transparent explanation of why an issue has its priority, per the "no black-box AI priority"
 * requirement: this is a rule-based score, and the reasons are the actual signals that produced it.
 */
export function PriorityReasons({ priority, reasons, score }: { priority: Priority; reasons?: string[]; score?: number }) {
  return (
    <div className="rounded-lg border border-line bg-sunken/50 p-3">
      <div className="flex items-center justify-between">
        <PriorityBadge priority={priority} />
        {typeof score === 'number' && <span className="text-xs text-muted">Score: {score}/100</span>}
      </div>
      {!!reasons?.length && (
        <ul className="mt-2 space-y-1">
          {reasons.map((r) => (
            <li key={r} className="flex items-start gap-1.5 text-xs text-muted"><Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
