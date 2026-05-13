/**
 * SkeletonPanel — reusable "Ingest pending" placeholder for SSOT panels.
 *
 * Used when a Supabase table returns 0 rows for the target coin — we don't
 * know yet whether the data is truly missing or just not ingested. A
 * pulse-animated skeleton + small "syncing" label is friendlier than a blank
 * section heading.
 */
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  hint?: string;
  rows?: number;
  className?: string;
}

export function SkeletonPanel({ title, hint, rows = 3, className }: Props) {
  return (
    <section className={cn('surface p-5 space-y-3', className)}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading">{title}</h2>
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          syncing…
        </span>
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-3 w-6 rounded bg-muted/70" />
            <div className="h-3 flex-1 rounded bg-muted/70" />
            <div className="h-3 w-16 rounded bg-muted/70" />
            <div className="h-3 w-20 rounded bg-muted/70" />
          </div>
        ))}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
    </section>
  );
}
