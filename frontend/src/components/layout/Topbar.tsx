'use client';
import { ChevronDown, Menu, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { roleLabel } from '@/lib/roles';
import { useT } from '@/lib/i18n/I18nProvider';
import type { User } from '@/types';

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu" className="flex h-9 items-center gap-2 rounded px-2 hover:bg-sunken">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{user.fullName.slice(0, 1).toUpperCase()}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden />
      </button>
      {open && (
        <div role="menu" onMouseLeave={() => setOpen(false)} className="absolute right-0 top-11 z-50 w-60 rounded-lg border border-line bg-surface p-2 shadow-pop">
          <div className="border-b border-line px-2 pb-2"><p className="truncate text-sm font-medium">{user.fullName}</p><p className="truncate text-xs text-muted">{user.email} · {roleLabel[user.role]}</p></div>
          <Link role="menuitem" href="/profile" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded px-2 py-2 text-sm hover:bg-sunken"><UserIcon className="h-4 w-4" aria-hidden />{t('nav.profile')}</Link>
        </div>
      )}
    </div>
  );
}

export function Topbar({ user, onMenu }: { user: User; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} aria-label="Open navigation" className="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-sunken lg:hidden"><Menu className="h-5 w-5" /></button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-1"><LanguageSelector /><ThemeToggle /><NotificationBell /><UserMenu user={user} /></div>
    </header>
  );
}
