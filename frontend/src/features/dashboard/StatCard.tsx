import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

export function StatCard({ label, value, icon: Icon, tone = 'neutral' }: { label: string; value: number | string; icon?: LucideIcon; tone?: 'neutral' | 'warning' | 'danger' | 'success' }) {
  const toneCls = { neutral: 'text-fg', warning: 'text-warning', danger: 'text-danger', success: 'text-success' }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted" aria-hidden />}
      </div>
      <p className={cn('mt-3 text-3xl font-semibold', toneCls)}>{value}</p>
    </Card>
  );
}

export const StatCardGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
);
