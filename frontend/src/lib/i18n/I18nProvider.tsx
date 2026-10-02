'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANG, DICTIONARIES, type LangCode } from './dictionaries';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'cp-lang';

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? String(vars[k]) : `{{${k}}}`));
}

interface I18nCtx {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  /** Looks up a dot-path key (e.g. "nav.dashboard") in the active language, falling back to English, then the key itself. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();

  // On first mount: prefer an explicit local choice; otherwise fall back to the signed-in user's
  // saved preference (set at registration or in Settings), then English.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    const fromUser = user?.preferredLanguage as LangCode | undefined;
    const initial = (stored && DICTIONARIES[stored] && stored) || (fromUser && DICTIONARIES[fromUser] && fromUser) || DEFAULT_LANG;
    setLangState(initial);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: LangCode) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
    // Best-effort sync to the account so the choice follows the person across devices.
    // Failure here (e.g. not logged in) must never block switching the UI language.
    if (user) api('/users/me/language', { method: 'PATCH', body: { preferredLanguage: next } }).catch(() => {});
  };

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANG];
      const value = getByPath(dict, key) ?? getByPath(DICTIONARIES[DEFAULT_LANG], key);
      return typeof value === 'string' ? interpolate(value, vars) : key;
    };
  }, [lang]);

  // Avoid a flash of a different language than what was saved: render nothing extra, just pass
  // through children immediately with the default, then re-render once hydrated (near-instant).
  void hydrated;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** Shorthand for translation-only consumers. */
export function useT() {
  return useI18n().t;
}
