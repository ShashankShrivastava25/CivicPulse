'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ui/Toast';
import { I18nProvider } from '@/lib/i18n/I18nProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));
  return (
    <QueryClientProvider client={client}>
      <I18nProvider>
        <ThemeProvider><ToastProvider>{children}</ToastProvider></ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
