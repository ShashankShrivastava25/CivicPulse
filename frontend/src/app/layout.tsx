import type { Metadata } from 'next';
import { Fraunces, Public_Sans } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { themeInitScript } from '@/components/ThemeProvider';
import '@/styles/globals.css';

const sans = Public_Sans({ subsets: ['latin'], variable: '--font-sans' });
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['opsz'] });

export const metadata: Metadata = {
  title: 'CivicPulse: Report it once. Let AI handle the rest.',
  description: 'Report local civic problems, discover similar complaints, and make community issues visible to the people who resolve them.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
