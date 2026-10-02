'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted">Page {page} of {pages}</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}><ChevronLeft className="h-4 w-4" />Prev</Button>
        <Button variant="secondary" size="sm" onClick={() => onChange(page + 1)} disabled={page >= pages}>Next<ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
