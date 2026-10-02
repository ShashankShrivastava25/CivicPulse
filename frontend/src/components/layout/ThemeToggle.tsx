'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export function ThemeToggle() {
  const { pref, setPref } = useTheme();
  const isDark = () => document.documentElement.classList.contains('dark');
  return (
    <button
      type="button" aria-label="Toggle light and dark theme" title={`Theme: ${pref}`}
      onClick={() => setPref(isDark() ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-sunken hover:text-fg"
    >
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden /><Moon className="h-4 w-4 dark:hidden" aria-hidden />
    </button>
  );
}
