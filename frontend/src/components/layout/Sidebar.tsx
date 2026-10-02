'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Logo } from './Logo';
import { NAV } from '@/features/dashboard/nav';
import { authService } from '@/services/authService';
import { homeForRole } from '@/lib/roles';
import { cn } from '@/utils/cn';
import { useT } from '@/lib/i18n/I18nProvider';
import type { Role } from '@/types';

export function Sidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const t = useT();
  const base = 'flex w-full items-center gap-3 rounded px-3 py-2 text-sm';

  const logout = async () => {
    try { await authService.logout(); } finally { qc.setQueryData(['me'], null); router.replace('/login'); }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-line px-5"><Logo href={homeForRole(role)} /></div>
      <nav aria-label="Sidebar" className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV[role].map(({ label, tKey, icon: Icon, href, action }) => {
          const text = t(tKey);
          if (action === 'logout') return (
            <button key={label} onClick={logout} className={cn(base, 'mt-3 text-muted hover:bg-sunken hover:text-fg')}><Icon className="h-4 w-4" aria-hidden />{text}</button>
          );
          if (!href) return (
            <span key={label} aria-disabled className={cn(base, 'cursor-not-allowed text-muted/60')}>
              <Icon className="h-4 w-4" aria-hidden /><span className="flex-1">{text}</span>
              <span className="rounded-full bg-sunken px-1.5 py-0.5 text-[10px]">{t('common.comingSoon')}</span>
            </span>
          );
          const active = path === href;
          return (
            <Link key={label} href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
              className={cn(base, active ? 'bg-primary-soft font-medium text-primary' : 'text-muted hover:bg-sunken hover:text-fg')}>
              <Icon className="h-4 w-4" aria-hidden />{text}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
