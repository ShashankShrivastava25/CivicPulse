'use client';
import { useEffect, useState } from 'react';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemePref, useTheme } from '@/components/ThemeProvider';
import { LANGUAGES } from '@/lib/validators';
import { roleLabel } from '@/lib/roles';
import type { User } from '@/types';

const Section = ({ title, children, soon }: { title: string; children: React.ReactNode; soon?: boolean }) => (
  <Card className="p-6"><div className="mb-4 flex items-center gap-2"><h2 className="font-semibold">{title}</h2>{soon && <Badge>Partly available</Badge>}</div>{children}</Card>
);

export function SettingsView({ user }: { user: User }) {
  const { pref, setPref } = useTheme();
  const [lang, setLang] = useState('en');
  useEffect(() => setLang(localStorage.getItem('cp-lang') || user.preferredLanguage || 'en'), [user.preferredLanguage]);
  const themes: [ThemePref, string][] = [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']];

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="Appearance">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {themes.map(([v, l]) => (
            <button key={v} role="radio" aria-checked={pref === v} onClick={() => setPref(v)}
              className={`h-10 rounded border text-sm font-medium ${pref === v ? 'border-primary bg-primary-soft text-primary' : 'border-line hover:bg-sunken'}`}>{l}</button>
          ))}
        </div>
      </Section>
      <Section title="Language" soon>
        <select aria-label="Language" value={lang} onChange={(e) => { setLang(e.target.value); localStorage.setItem('cp-lang', e.target.value); }}
          className="h-10 w-full rounded border border-line bg-surface px-3 text-sm">
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <p className="mt-2 text-xs text-muted">Your choice is saved on this device. Full translations arrive in a later phase.</p>
      </Section>
      <Section title="Account">
        <dl className="divide-y divide-line text-sm">
          <div className="flex justify-between py-2"><dt className="text-muted">Email</dt><dd>{user.email}</dd></div>
          <div className="flex justify-between py-2"><dt className="text-muted">Role</dt><dd>{roleLabel[user.role]}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted">Edit your name, phone and location on the Profile page.</p>
      </Section>
      <Section title="Security">
        <p className="text-sm text-muted">Sessions use secure HTTP-only cookies. To change your password now, use the reset flow.</p>
        <Button href="/forgot-password" variant="secondary" size="sm" className="mt-3">Reset password</Button>
      </Section>
    </div>
  );
}
