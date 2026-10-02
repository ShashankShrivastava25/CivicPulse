'use client';
import { motion } from 'framer-motion';
import { Droplets, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/** Sample complaint cluster: several citizens, one visible problem. Demo content only. */
function ClusterPreview() {
  const reports = ['Water pooling near the school gate', 'Drain overflowing since Monday', 'Road under water after rain'];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
      className="rounded-lg border border-line bg-surface p-5 shadow-pop">
      <div className="mb-4 flex items-center justify-between text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden />Sample ward, demo data</span>
        <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">Grouped by similarity</span>
      </div>
      <div className="space-y-2">
        {reports.map((r, i) => (
          <motion.div key={r} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.25 }}
            className="flex items-center gap-3 rounded border border-line bg-bg px-3 py-2.5 text-sm">
            <Droplets className="h-4 w-4 shrink-0 text-info" aria-hidden />{r}
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        className="mt-4 flex items-center justify-between rounded bg-primary-soft px-4 py-3">
        <div><p className="text-sm font-medium text-primary">One issue: Blocked drainage</p><p className="text-xs text-muted">3 reports merged into a single visible problem</p></div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary"><Users className="h-4 w-4" aria-hidden />3</span>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section id="home" className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">Report Civic Issues. Create Real Change.</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">CivicPulse helps citizens report local civic problems, discover similar complaints, and make community issues more visible to the people responsible for resolving them.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/login" size="lg">Report an Issue</Button>
          <Button href="/login" size="lg" variant="secondary">Explore Issues</Button>
        </div>
      </div>
      <ClusterPreview />
    </section>
  );
}
