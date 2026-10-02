'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { Button } from '@/components/ui/Button';

const links = [
  { href: '#home', label: 'Home' }, { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' }, { href: '#impact', label: 'Impact' }, { href: '#about', label: 'About' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => <a key={l.href} href={l.href} className="rounded px-3 py-2 text-sm text-muted hover:text-fg">{l.label}</a>)}
        </nav>
        <div className="hidden items-center gap-1 lg:flex">
          <LanguageSelector /><ThemeToggle />
          <Button href="/login" variant="ghost" size="sm">Login</Button>
          <Button href="/register" size="sm">Sign Up</Button>
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)} className="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-sunken">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-line bg-bg lg:hidden">
            <nav aria-label="Mobile" className="flex flex-col px-4 py-3">
              {links.map((l) => <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded px-2 py-3 text-base">{l.label}</a>)}
              <div className="mt-2 flex items-center justify-between border-t border-line pt-3"><LanguageSelector />
                <div className="flex gap-2"><Button href="/login" variant="secondary" size="sm">Login</Button><Button href="/register" size="sm">Sign Up</Button></div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
