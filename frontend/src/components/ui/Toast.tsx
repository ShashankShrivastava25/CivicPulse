'use client';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; tone: Tone }
interface ToastCtx { push: (message: string, tone?: Tone) => void }

const Ctx = createContext<ToastCtx | null>(null);
const icons: Record<Tone, React.ElementType> = { success: CheckCircle2, error: AlertCircle, info: Info };
const tones: Record<Tone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-info/30 bg-info/10 text-info',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((cur) => [...cur, { id, message, tone }]);
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 5000);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {items.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div key={t.id} role="status" className={cn('pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 shadow-pop backdrop-blur', 'bg-surface', tones[t.tone])}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="flex-1 text-sm">{t.message}</p>
              <button aria-label="Dismiss" onClick={() => setItems((cur) => cur.filter((x) => x.id !== t.id))} className="text-muted hover:text-fg"><X className="h-3.5 w-3.5" /></button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
