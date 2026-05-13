'use client';

/**
 * FreshnessBadge — "3 min ago" style live timestamp.
 *
 * Why client component: timestamps need to tick. Server-rendered "X min ago"
 * snapshots become stale instantly in CDN-cached pages. We hydrate once on
 * mount and refresh every 30 s.
 */
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  iso: string | null | undefined;
  /** Visual variant — 'dot' shows a coloured ping pulse for very recent updates. */
  variant?: 'plain' | 'dot';
  className?: string;
}

function age(iso: string): { label: string; bucket: 'fresh' | 'recent' | 'stale' | 'old' } {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return { label: `${s}s ago`, bucket: 'fresh' };
  const m = Math.floor(s / 60);
  if (m < 60) return { label: `${m}m ago`, bucket: m < 10 ? 'fresh' : 'recent' };
  const h = Math.floor(m / 60);
  if (h < 24) return { label: `${h}h ago`, bucket: h < 6 ? 'recent' : 'stale' };
  const d = Math.floor(h / 24);
  return { label: `${d}d ago`, bucket: 'old' };
}

export function FreshnessBadge({ iso, variant = 'plain', className }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!iso) return null;
  const a = age(iso);
  const dotColor =
    a.bucket === 'fresh' ? 'bg-gain' :
    a.bucket === 'recent' ? 'bg-tier-a' :
    a.bucket === 'stale' ? 'bg-tier-d' :
    'bg-muted-foreground/50';
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums', className)} title={iso}>
      {variant === 'dot' && (
        <span className="relative inline-flex h-2 w-2">
          {a.bucket === 'fresh' && (
            <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', dotColor)} />
          )}
          <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColor)} />
        </span>
      )}
      {a.label}
    </span>
  );
}
