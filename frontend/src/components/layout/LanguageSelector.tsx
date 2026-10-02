'use client';
import { Globe } from 'lucide-react';
import { LANGUAGES } from '@/lib/validators';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Global language switcher. Persists to localStorage immediately and, when signed in, to the account. */
export function LanguageSelector() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="relative inline-flex h-9 items-center gap-1.5 rounded px-2 text-muted hover:bg-sunken hover:text-fg">
      <Globe className="h-4 w-4" aria-hidden />
      <span className="sr-only">{t('nav.settings')} — language</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as typeof lang)}
        className="cursor-pointer appearance-none bg-transparent text-sm focus-visible:outline-primary"
      >
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </label>
  );
}
