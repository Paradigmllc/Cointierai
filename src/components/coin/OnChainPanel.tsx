'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { formatCompact, formatPercent, cn } from '@/lib/utils';

interface Props {
  slug: string;
  locale: 'ja' | 'en' | string;
}

interface OnChainMetrics {
  activeAddresses24h: number | null;
  txCount24h: number | null;
  txVolumeUsd24h: number | null;
  nvtRatio: number | null;
  vladimirClubCost: number | null;
  athPercentDown: number | null;
  cycleLowPercentUp: number | null;
}

export function OnChainPanel({ slug, locale }: Props) {
  const [m, setM] = useState<OnChainMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/onchain?slug=${slug}`).catch(() => null);
      if (!res || !res.ok) {
        if (!cancelled) setM(null);
        return;
      }
      const data = (await res.json()) as OnChainMetrics;
      if (!cancelled) setM(data);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (!m) return null;
  const hasAny = m.activeAddresses24h || m.txCount24h || m.txVolumeUsd24h || m.nvtRatio;
  if (!hasAny) return null;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />{locale === 'ja' ? 'オンチェーン指標' : 'On-chain metrics'}</h2>
        <span className="text-[10px] text-muted-foreground">Messari · 24h</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Tile label="Active addresses 24h" value={m.activeAddresses24h ? formatCompact(m.activeAddresses24h) : '—'} />
        <Tile label="Tx count 24h" value={m.txCount24h ? formatCompact(m.txCount24h) : '—'} />
        <Tile label="Tx volume 24h" value={m.txVolumeUsd24h ? `$${formatCompact(m.txVolumeUsd24h)}` : '—'} />
        <Tile label="NVT (adjusted)" value={m.nvtRatio ? m.nvtRatio.toFixed(2) : '—'} />
        {m.cycleLowPercentUp != null && (
          <Tile label="From cycle low" value={`+${formatPercent(m.cycleLowPercentUp, 1)}`} positive />
        )}
        {m.athPercentDown != null && (
          <Tile label="ATH drawdown" value={`${formatPercent(-m.athPercentDown, 1)}`} negative />
        )}
        {m.vladimirClubCost != null && (
          <Tile label="Vladimir Club cost" value={`$${formatCompact(m.vladimirClubCost)}`} />
        )}
      </div>
    </section>
  );
}

function Tile({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-subtle p-3 space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('text-[13px] font-semibold tabular-nums', positive && 'text-gain', negative && 'text-loss')}>{value}</div>
    </div>
  );
}
