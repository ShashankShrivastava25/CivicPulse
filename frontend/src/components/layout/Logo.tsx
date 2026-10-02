import Link from 'next/link';

/** Wordmark: a location pin whose inner dot is a pulse. */
export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2C8 2 5 5 5 9c0 5.2 7 13 7 13s7-7.800 7-13c0-4-3-7-7-7Z" className="fill-primary" />
        <path d="M7.500 10h2.300l1.200-2.500 2 5 1.200-2.500h2.300" fill="none" stroke="rgb(var(--primary-fg))" strokeWidth="1.500" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      CivicPulse
    </Link>
  );
}
