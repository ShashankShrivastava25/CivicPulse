import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function AuthShell({ title, subtitle, children, footer, wide }: {
  title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6"><Logo /><ThemeToggle /></header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:pt-12">
        <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="mt-8 rounded-lg border border-line bg-surface p-6 shadow-card sm:p-8">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
        </div>
      </main>
    </div>
  );
}

export const AuthLink = ({ href, children }: { href: string; children: React.ReactNode }) =>
  <Link href={href} className="font-medium text-primary hover:underline">{children}</Link>;

export function FormAlert({ tone = 'danger', children }: { tone?: 'danger' | 'success'; children: React.ReactNode }) {
  const c = tone === 'danger' ? 'border-danger/30 bg-danger/10 text-danger' : 'border-success/30 bg-success/10 text-success';
  return <div role={tone === 'danger' ? 'alert' : 'status'} className={`mb-4 rounded border px-3 py-2 text-sm ${c}`}>{children}</div>;
}
