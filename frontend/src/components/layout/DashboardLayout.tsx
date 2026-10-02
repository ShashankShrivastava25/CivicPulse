'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { homeForRole } from '@/lib/roles';
import type { Role } from '@/types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const ALL: Role[] = ['CITIZEN', 'PUBLIC_SERVANT', 'ADMIN'];

/** Client-side route guard for UX. The API enforces the real access rules. */
export function DashboardLayout({ roles = ALL, title, children }: { roles?: Role[]; title?: string; children: (user: NonNullable<ReturnType<typeof useAuth>['user']>) => React.ReactNode }) {
  const { user, isLoading, error, refetch } = useAuth();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (isLoading || error) return;
    if (!user) router.replace('/login');
    else if (!roles.includes(user.role)) router.replace(homeForRole(user.role));
  }, [user, isLoading, error, roles, router]);

  if (error) return <ErrorState message="We could not load your account." onRetry={() => refetch()} />;
  if (isLoading || !user || !roles.includes(user.role)) return <LoadingState label="Loading your workspace" />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block"><Sidebar role={user.role} /></aside>
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween', duration: 0.2 }} className="absolute inset-y-0 left-0 w-64 bg-surface shadow-pop">
              <Sidebar role={user.role} onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
      <div className="min-w-0">
        <Topbar user={user} onMenu={() => setDrawer(true)} />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {title && <h1 className="mb-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>}
          {children(user)}
        </main>
      </div>
    </div>
  );
}
