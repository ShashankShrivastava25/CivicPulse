import type { Metadata } from 'next';
import { Fraunces, Public_Sans, Inter, Instrument_Serif } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { themeInitScript } from '@/components/ThemeProvider';
import '@/styles/globals.css';

// dark theme fonts (unchanged)
const sans = Public_Sans({ subsets: ['latin'], variable: '--f-public' });
const display = Fraunces({ subsets: ['latin'], variable: '--f-fraunces', axes: ['opsz'] });
// light theme fonts
const lightSans = Inter({ subsets: ['latin'], variable: '--f-inter' });
const lightDisplay = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--f-serif' });

export const metadata: Metadata = {
  title: 'CivicPulse: Report it once. Let AI handle the rest.',
  description: 'Report local civic problems, discover similar complaints, and make community issues visible to the people who resolve them.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${lightSans.variable} ${lightDisplay.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}