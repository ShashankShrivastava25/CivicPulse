import { Badge, Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';

/** Honest placeholder: no fabricated numbers. */
export function StatPlaceholder({ label }: { label: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2"><p className="text-sm text-muted">{label}</p><Badge>Coming soon</Badge></div>
      <p className="mt-3 text-3xl font-semibold text-muted/50" aria-label="No data yet">—</p>
    </Card>
  );
}

export function SectionPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between"><h2 className="font-semibold">{title}</h2><Badge tone="primary">Planned</Badge></div>
      <EmptyState title="Nothing to show yet" description={description} />
    </Card>
  );
}

export const StatGrid = ({ labels }: { labels: string[] }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{labels.map((l) => <StatPlaceholder key={l} label={l} />)}</div>
);
