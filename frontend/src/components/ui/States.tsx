import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden /><span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-danger" aria-hidden />
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Inbox className="h-6 w-6 text-muted" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

/** Loading skeleton rows for tables/lists while data fetches. */
export function SkeletonRows({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-sunken" />
      ))}
    </div>
  );
}

export function SkeletonGrid({ items = 4 }: { items?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: items }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-sunken" />)}
    </div>
  );
}
