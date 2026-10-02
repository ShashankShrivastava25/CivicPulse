import { CheckCircle2, ClipboardEdit, Flag, MessageSquare, Shuffle, Sparkles, UserPlus } from 'lucide-react';
import type { TimelineEntry } from '@/types';

const ICONS: Record<string, React.ElementType> = {
  REPORTED: Flag, AI_ANALYSIS: Sparkles, ASSIGNED: UserPlus, REASSIGNED: Shuffle,
  STATUS_CHANGE: ClipboardEdit, ACTION_UPDATE: MessageSquare, RESOLVED: CheckCircle2,
};

/** Visual timeline for an issue: system + staff events, newest last. Matches the spec's date/time layout. */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (!entries.length) return <p className="text-sm text-muted">No activity yet.</p>;
  return (
    <ol className="relative space-y-5 border-l border-line pl-5">
      {entries.map((e) => {
        const Icon = ICONS[e.kind] ?? MessageSquare;
        const d = new Date(e.createdAt);
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Icon className="h-3 w-3" aria-hidden />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-xs font-medium text-muted">
                {d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} · {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </p>
              {e.visibility === 'INTERNAL' && <span className="rounded-full bg-sunken px-1.5 py-0.5 text-[10px] text-muted">Internal note</span>}
            </div>
            <p className="mt-0.5 text-sm">{e.message}</p>
            {e.imageUrl && <img src={e.imageUrl} alt="" className="mt-2 h-24 w-24 rounded object-cover" />}
            {e.author && <p className="mt-0.5 text-xs text-muted">{e.author.name} · {e.authorRole.replace('_', ' ').toLowerCase()}</p>}
          </li>
        );
      })}
    </ol>
  );
}
