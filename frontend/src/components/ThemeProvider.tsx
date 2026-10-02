'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
const KEY = 'cp-theme';
const Ctx = createContext<{ pref: ThemePref; setPref: (t: ThemePref) => void }>({ pref: 'system', setPref: () => {} });
export const useTheme = () => useContext(Ctx);

const apply = (pref: ThemePref) => {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
};

/** Inline script that runs before first paint, so there is no flash of the wrong theme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${KEY}')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('system');
  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as ThemePref) || 'system';
    setPrefState(saved);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => (localStorage.getItem(KEY) ?? 'system') === 'system' && apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const setPref = useCallback((t: ThemePref) => { localStorage.setItem(KEY, t); setPrefState(t); apply(t); }, []);
  return <Ctx.Provider value={{ pref, setPref }}>{children}</Ctx.Provider>;
}
