'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, useChartTheme } from '@/components/ui/chart';
import { formatCompact, formatPercent } from '@/lib/utils';

export interface AllocationBucket {
  category: string;
  amount: number;
  pctOfSupply?: number;
  description?: string | null;
}

interface Props {
  /** Token unlock events grouped by category — used to infer initial allocation. */
  unlocks?: Array<{ amount: number; category: string | null; percentage_of_supply?: number | null }>;
  /** If we already have richer allocation data (CryptoRank vesting / Messari supply), use it. */
  allocation?: AllocationBucket[];
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  symbol: string;
  locale: 'ja' | 'en' | string;
}

export function TokenomicsPanel({ unlocks, allocation, circulatingSupply, totalSupply, maxSupply, symbol, locale }: Props) {
  const theme = useChartTheme();
  const buckets = useMemo<AllocationBucket[]>(() => {
    if (allocation && allocation.length > 0) return allocation;
    // Derive from unlock events when no explicit allocation table is loaded.
    if (!unlocks || unlocks.length === 0) {
      // Last-resort: circulating vs locked vs unmined.
      const out: AllocationBucket[] = [];
      if (circulatingSupply) out.push({ category: 'Circulating', amount: circulatingSupply });
      if (totalSupply && circulatingSupply && totalSupply > circulatingSupply) {
        out.push({ category: 'Locked / Reserved', amount: totalSupply - circulatingSupply });
      }
      if (maxSupply && totalSupply && maxSupply > totalSupply) {
        out.push({ category: 'Not yet minted', amount: maxSupply - totalSupply });
      }
      return out;
    }
    // Aggregate unlock events by category.
    const byCat = new Map<string, number>();
    for (const u of unlocks) {
      const k = u.category ?? 'Other';
      byCat.set(k, (byCat.get(k) ?? 0) + u.amount);
    }
    return [...byCat.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [allocation, unlocks, circulatingSupply, totalSupply, maxSupply]);

  if (buckets.length === 0) return null;

  const totalAmount = buckets.reduce((s, b) => s + b.amount, 0);
  const data = buckets.map((b) => ({
    name: b.category,
    value: b.amount,
    pct: (b.amount / totalAmount) * 100,
  }));

  return (
    <section className="surface p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading">{locale === 'ja' ? 'トケノミクス配分' : 'Tokenomics allocation'}</h2>
        <span className="text-[10px] text-muted-foreground">{buckets.length} buckets · {symbol.toUpperCase()}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={1} stroke="hsl(var(--background))" strokeWidth={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={theme.palette[i % theme.palette.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
                formatter={(v: number, _n, payload) => {
                  const p = (payload as { payload?: { pct?: number } } | undefined)?.payload;
                  const pct = p?.pct ?? 0;
                  return [`${formatCompact(v)} ${symbol.toUpperCase()} (${pct.toFixed(1)}%)`, ''];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-[11px]">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: theme.palette[i % theme.palette.length] }} />
              <span className="flex-1 truncate">{d.name}</span>
              <span className="num tabular-nums text-foreground/80">{formatCompact(d.value)}</span>
              <span className="num tabular-nums text-muted-foreground w-12 text-right">{formatPercent(d.pct, 1)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
