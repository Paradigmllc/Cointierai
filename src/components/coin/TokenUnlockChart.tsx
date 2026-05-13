'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';
import { useMemo } from 'react';
import { formatCompact, formatPercent } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface UnlockEvent {
  unlock_date: string;
  amount: number;
  percentage_of_supply: number | null;
  category: string | null;
  source: string | null;
}

interface TokenUnlockChartProps {
  unlocks: UnlockEvent[];
  /** Reference price for USD value on the secondary axis. */
  priceUsd?: number | null;
  /** Display locale. */
  locale: string;
  symbol: string;
  /** Cap the visible window in days from today. */
  windowDays?: number;
}

const CATEGORY_COLOR: Record<string, string> = {
  team: '#EA3943',
  investors: '#EA3943',
  advisors: '#FB923C',
  treasury: '#635BFF',
  ecosystem: '#16C784',
  community: '#16C784',
  rewards: '#FFD700',
  staking: '#FFD700',
  airdrop: '#10B981',
  public: '#9CA3AF',
};

function colorFor(category: string | null): string {
  if (!category) return '#9CA3AF';
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_COLOR)) {
    if (key.includes(k)) return v;
  }
  return '#6B7280';
}

/**
 * Token vesting visualization — composed bar (per-event amount) + cumulative
 * supply area. Tooltip surfaces category, percentage_of_supply, and inferred
 * USD value. Designed to be a Cointier differentiator vs. CMC/CryptoRank,
 * which both expose only a flat table.
 */
export function TokenUnlockChart({ unlocks, priceUsd, locale, symbol, windowDays = 365 }: TokenUnlockChartProps) {
  const data = useMemo(() => {
    const now = Date.now();
    const cutoff = now + windowDays * 86_400_000;
    const future = unlocks
      .filter((u) => {
        const t = new Date(u.unlock_date).getTime();
        return t >= now && t <= cutoff;
      })
      .sort((a, b) => new Date(a.unlock_date).getTime() - new Date(b.unlock_date).getTime());

    let cumulativePct = 0;
    return future.map((u) => {
      const pct = u.percentage_of_supply ?? 0;
      cumulativePct += pct;
      return {
        date: u.unlock_date.slice(0, 10),
        amount: u.amount,
        usdValue: priceUsd ? u.amount * priceUsd : null,
        category: u.category ?? 'other',
        pct,
        cumulativePct,
        color: colorFor(u.category),
      };
    });
  }, [unlocks, priceUsd, windowDays]);

  const totalUsd = useMemo(
    () => data.reduce((s, d) => s + (d.usdValue ?? 0), 0),
    [data],
  );
  const totalPct = data[data.length - 1]?.cumulativePct ?? 0;

  if (data.length === 0) {
    return (
      <section className="surface p-5 space-y-2">
        <h2 className="section-heading flex items-center gap-2">
          <Lock className="h-4 w-4 text-tier-d" />
          {locale === 'ja' ? 'トークンアンロックスケジュール' : 'Token unlock schedule'}
        </h2>
        <p className="text-[12px] text-muted-foreground">
          {locale === 'ja' ? '今後 1 年以内のアンロック予定はありません。' : 'No scheduled unlocks within the next 12 months.'}
        </p>
      </section>
    );
  }

  return (
    <section className="surface p-5 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-heading flex items-center gap-2">
            <Lock className="h-4 w-4 text-tier-d" />
            {locale === 'ja' ? 'トークンアンロックスケジュール' : 'Token unlock schedule'}
            <span className="text-[11px] text-muted-foreground font-normal">({windowDays}d)</span>
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {locale === 'ja' ? 'カテゴリ別の供給増加と累積アンロック率を可視化' : 'Per-event supply additions with cumulative unlock %'}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-right">
          <Stat label={locale === 'ja' ? 'イベント' : 'Events'} value={data.length.toString()} />
          <Stat label={locale === 'ja' ? '累積 %' : 'Cumulative'} value={formatPercent(totalPct, 2)} />
          <Stat label={locale === 'ja' ? '推定 USD' : 'Est. USD'} value={totalUsd > 0 ? formatCompact(totalUsd) : '—'} />
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickFormatter={(v: string) => v.slice(5)}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              yAxisId="amount"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickFormatter={(v: number) => formatCompact(v)}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-md border border-border bg-popover shadow-card p-2.5 text-[11px] space-y-1">
                    <div className="font-semibold">{p.date}</div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="capitalize text-muted-foreground">{p.category}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="num tabular-nums font-medium">{formatCompact(p.amount)} {symbol.toUpperCase()}</span>
                    </div>
                    {p.usdValue != null && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">USD value</span>
                        <span className="num tabular-nums font-medium">{formatCompact(p.usdValue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">% supply</span>
                      <span className="num tabular-nums font-medium">{formatPercent(p.pct, 3)}</span>
                    </div>
                    <div className="flex justify-between gap-4 pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">Cumulative</span>
                      <span className="num tabular-nums font-semibold">{formatPercent(p.cumulativePct, 2)}</span>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              yAxisId="pct"
              type="monotone"
              dataKey="cumulativePct"
              fill="rgba(99,91,255,0.12)"
              stroke="rgba(99,91,255,0.7)"
              strokeWidth={1.5}
              name={locale === 'ja' ? '累積 %' : 'Cumulative %'}
            />
            <Bar yAxisId="amount" dataKey="amount" name={locale === 'ja' ? 'アンロック量' : 'Unlock amount'} radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconSize={8} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground pt-2 border-t border-border/50">
        {Array.from(new Set(data.map((d) => d.category))).map((cat) => (
          <span key={cat} className="inline-flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: colorFor(cat) }} />
            <span className="capitalize">{cat}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="num tabular-nums text-[13px] font-semibold">{value}</div>
    </div>
  );
}
