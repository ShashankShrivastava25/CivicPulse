import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (name: string) =>
  Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [n, v(`${name}-${n}`)]));
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), surface: v('surface'), sunken: v('sunken'), fg: v('fg'), muted: v('muted'), line: v('line'),
        primary: { DEFAULT: v('primary'), fg: v('primary-fg'), soft: v('primary-soft') },
        accent: { DEFAULT: v('accent'), soft: v('accent-soft') },
        success: v('success'), warning: v('warning'), danger: v('danger'), info: v('info'),
        // theme-aware remap of the hard-coded gray / blue classes used on citizen pages
        gray: scale('gray'), blue: scale('blue'),
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'], display: ['var(--font-display)', 'Georgia', 'serif'] },
      borderRadius: { DEFAULT: 'var(--radius)', lg: 'var(--radius-lg)' },
      boxShadow: { card: '0 1px 2px rgb(var(--shadow) / 0.06)', pop: '0 8px 24px rgb(var(--shadow) / 0.12)' },
    },
  },
  plugins: [],
};
export default config;