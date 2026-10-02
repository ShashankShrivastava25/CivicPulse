import { cn } from '@/utils/cn';

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-line bg-surface shadow-card', className)} {...p} />;
}

const tones = {
  neutral: 'bg-sunken text-muted', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger', info: 'bg-info/10 text-info', primary: 'bg-primary-soft text-primary',
};
export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>;
}
