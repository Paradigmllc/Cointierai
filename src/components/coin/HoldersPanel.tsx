'use client';

import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, useChartTheme } from '@/components/ui/chart';
import { formatCompact, formatPercent } from '@/lib/utils';

interface Props {
  chain: string | null;
  contract: string | null;
  symbol: string;
  totalSupply: number | null;
  locale: 'ja' | 'en' | string;
}

interface Holder {
  rank: number;
  address: string;
  amount: number;
  pct: number;
  label?: string;
}

export function HoldersPanel({ chain, contract, symbol, totalSupply, locale }: Props) {
  const theme = useChartTheme();
  const [holders, setHolders] = useState<Holder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chain || !contract) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/holders?chain=${chain}&contract=${contract}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { holders: Holder[] };
        if (!cancelled) setHolders(data.holders);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'fetch failed');
      }
    })();
    return () => { cancelled = true; };
  }, [chain, contract]);

  if (!chain || !contract) {
    return (
      <section className="surface p-5 space-y-2">
        <h2 className="section-heading flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{locale === 'ja' ? 'ホルダー分布' : 'Holders distribution'}</h2>
        <p className="text-[11px] text-muted-foreground">
          {locale === 'ja' ? 'ネイティブチェーンコイン (BTC / ETH 等) はオンチェーンの集計が異なるため未対応' : 'Native chain coins (BTC / ETH) use different on-chain accounting and are not covered here.'}
        </p>
      </section>
    );
  }

  const top10Pct = holders ? holders.slice(0, 10).reduce((s, h) => s + h.pct, 0) : 0;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{locale === 'ja' ? 'ホルダー分布 Top 10' : 'Top 10 holders'}</h2>
        <span className="text-[10px] text-muted-foreground">{chain} · {symbol.toUpperCase()}</span>
      </div>
      {!holders && !error && <div className="text-[11px] text-muted-foreground py-8 text-center">Loading…</div>}
      {error && (
        <div className="text-[11px] text-muted-foreground py-4 text-center">
          {locale === 'ja' ? 'オンチェーン取得失敗 (API キー未設定の可能性)' : 'On-chain fetch unavailable (likely missing API key)'}
        </div>
      )}
      {holders && holders.length > 0 && (
        <>
          <div className="flex items-center gap-3 text-[12px]">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Top 10 own</div>
              <div className="text-lg font-semibold tabular-nums">{formatPercent(top10Pct, 1)}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total supply</div>
              <div className="num text-[12px]">{totalSupply ? formatCompact(totalSupply) : '—'}</div>
            </div>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={holders.slice(0, 10).map((h) => ({ rank: `#${h.rank}`, pct: h.pct }))}>
                <XAxis dataKey="rank" stroke={theme.axis} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${v.toFixed(2)}%`, '']} />
                <Bar dataKey="pct" fill={theme.palette[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border bg-subtle divide-y divide-border/60 text-[11px]">
            {holders.slice(0, 10).map((h) => (
              <div key={h.address} className="flex items-center gap-2 px-3 py-1.5">
                <span className="text-muted-foreground w-6">#{h.rank}</span>
                <code className="flex-1 truncate text-foreground/80 font-mono text-[10px]">{h.label ?? h.address}</code>
                <span className="num tabular-nums w-20 text-right">{formatPercent(h.pct, 2)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
