import { Bell, Camera, Copy, Languages, Map, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/layout/Logo';

const wrap = 'mx-auto max-w-6xl px-4 sm:px-6';
const h2 = 'font-display text-3xl font-semibold tracking-tight sm:text-4xl';

export function Problem() {
  return (
    <section className="border-y border-line bg-surface">
      <div className={`${wrap} grid gap-8 py-16 md:grid-cols-2`}>
        <h2 className={h2}>The same problem gets reported ten times, and still gets missed.</h2>
        <div className="space-y-4 text-muted">
          <p>A broken streetlight or blocked drain is noticed by everyone on the street. Each person files a separate complaint, or none at all, assuming someone else already did.</p>
          <p>Officials end up sorting through scattered duplicates instead of fixing the problem. Citizens never learn whether anyone saw their report.</p>
        </div>
      </div>
    </section>
  );
}

const steps = [
  { t: 'Report', d: 'Describe the problem, add a photo and pin the location.' },
  { t: 'Match', d: 'CivicPulse checks whether neighbours already reported the same thing.' },
  { t: 'Support', d: 'Add your voice to an existing report instead of starting a new one.' },
  { t: 'Track', d: 'Follow updates as the responsible team takes action.' },
];
export function HowItWorks() {
  return (
    <section id="how-it-works" className={`${wrap} py-20`}>
      <h2 className={h2}>How it works</h2>
      <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.t} className="border-l-2 border-primary pl-4">
            <p className="text-sm font-medium text-primary">Step {i + 1}</p>
            <p className="mt-1 text-lg font-semibold">{s.t}</p>
            <p className="mt-1 text-sm text-muted">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const features = [
  { i: Camera, t: 'Photo and location reports', d: 'Give officials the evidence and the exact spot, pinned on a map.' },
  { i: Copy, t: 'AI-assisted duplicate detection', d: 'Image, text and location signals surface similar reports, so you can back an existing one instead of filing a repeat.' },
  { i: Map, t: 'Issue map', d: 'See what is being reported around you, filter by category and status.' },
  { i: Bell, t: 'Status updates', d: 'Get notified at every step, from assignment to resolution.' },
  { i: Languages, t: 'Your language', d: 'Available in English, Hindi, Marathi, Bengali, Gujarati, Tamil, Telugu, Kannada, Malayalam, Punjabi, Assamese and Odia.' },
  { i: ShieldCheck, t: 'Verified officials', d: 'Public servants are approved by administrators before they can act on reports.' },
];
export function Features() {
  return (
    <section id="features" className="border-y border-line bg-surface">
      <div className={`${wrap} py-20`}>
        <h2 className={h2}>Built for residents and the teams who serve them</h2>
        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ i: Icon, t, d }) => (
            <div key={t} className="flex gap-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
              <div><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted">{d}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Impact() {
  const demo = [['Reports received', '—'], ['Duplicates grouped', '—'], ['Issues resolved', '—']];
  return (
    <section id="impact" className={`${wrap} py-20`}>
      <h2 className={h2}>Impact you will be able to see</h2>
      <p className="mt-3 max-w-2xl text-muted">CivicPulse has not launched, so there are no real numbers to show. These placeholders mark where live community figures will appear.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {demo.map(([l, v]) => (
          <Card key={l} className="p-5"><p className="text-3xl font-semibold text-muted/60">{v}</p><p className="mt-1 text-sm">{l}</p><p className="mt-3 text-xs text-muted">Sample placeholder, no data yet</p></Card>
        ))}
      </div>
    </section>
  );
}

export function CallToAction() {
  return (
    <section className={`${wrap} pb-20`}>
      <div className="rounded-lg bg-primary px-6 py-12 text-primary-fg sm:px-12">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Report it once. Let AI handle the rest.</h2>
        <p className="mt-3 max-w-xl opacity-90">Create a free account to start reporting, or register as a public servant to help resolve issues.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/register" className="inline-flex h-12 items-center rounded bg-surface px-6 font-medium text-fg">Create an account</a>
          <a href="/login" className="inline-flex h-12 items-center rounded border border-primary-fg/40 px-6 font-medium">Login</a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer id="about" className="border-t border-line bg-surface">
      <div className={`${wrap} flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between`}>
        <div className="max-w-sm"><Logo /><p className="mt-3 text-sm text-muted">An AI-assisted civic issue reporting platform that helps communities be heard.</p></div>
        <div className="text-sm text-muted"><p className="font-medium text-fg">About</p><p className="mt-2 max-w-xs">CivicPulse is in early development. Features are being released in phases.</p></div>
      </div>
      <p className={`${wrap} border-t border-line py-4 text-xs text-muted`}>© {new Date().getFullYear()} CivicPulse</p>
    </footer>
  );
}
