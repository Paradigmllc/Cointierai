'use client';

import { cn, formatPercent } from '@/lib/utils';

interface Props {
  priceUsd: number | null;
  athUsd: number | null;
  athDate: string | null;
  atlUsd: number | null;
  atlDate: string | null;
  change_24h: number | null;
  change_7d: number | null;
  change_30d: number | null;
  change_1y: number | null;
  /** Optional Messari ROI (vs BTC / vs ETH). */
  changeVsBtc_7d?: number | null;
  changeVsEth_7d?: number | null;
  locale: 'ja' | 'en' | string;
}

export function PerformancePanel(p: Props) {
  const fromAth = p.athUsd && p.priceUsd ? ((p.priceUsd - p.athUsd) / p.athUsd) * 100 : null;
  const fromAtl = p.atlUsd && p.priceUsd ? ((p.priceUsd - p.atlUsd) / p.atlUsd) * 100 : null;
  const cells = [
    { label: '24h', v: p.change_24h },
    { label: '7d', v: p.change_7d },
    { label: '30d', v: p.change_30d },
    { label: '1y', v: p.change_1y },
    { label: 'vs BTC 7d', v: p.changeVsBtc_7d },
    { label: 'vs ETH 7d', v: p.changeVsEth_7d },
    { label: 'from ATH', v: fromAth },
    { label: 'from ATL', v: fromAtl },
  ];
  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading">{p.locale === 'ja' ? 'パフォーマンス' : 'Performance'}</h2>
        <span className="text-[10px] text-muted-foreground">ROI · ATH/ATL distance</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-subtle p-3 space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</div>
            <div className={cn(
              'text-base font-semibold tabular-nums',
              c.v == null ? 'text-muted-foreground/40' : c.v >= 0 ? 'text-gain' : 'text-loss',
            )}>
              {c.v == null ? '—' : `${c.v >= 0 ? '+' : ''}${formatPercent(c.v, 2)}`}
            </div>
          </div>
        ))}
      </div>
      {(p.athDate || p.atlDate) && (
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/40">
          {p.athDate && (
            <span>ATH <span className="text-foreground/80 tabular-nums">{p.athDate.slice(0, 10)}</span></span>
          )}
          {p.atlDate && (
            <span>ATL <span className="text-foreground/80 tabular-nums">{p.atlDate.slice(0, 10)}</span></span>
          )}
        </div>
      )}
    </section>
  );
}
