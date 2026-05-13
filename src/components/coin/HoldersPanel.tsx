/**
 * SSOT-first holders panel. Reads cointier.holders_snapshots (populated by
 * ingestHolders cron). Visualised as a bar chart of top-10 % concentration.
 */
import { Wallet } from 'lucide-react';
import { getLatestHolders } from '@/lib/db/ssot-queries';
import { HoldersChart } from './HoldersChart';
import { formatCompact, formatPercent } from '@/lib/utils';

interface Props {
  coinId: string;
  chain: string | null;
  contract: string | null;
  symbol: string;
  totalSupply: number | null;
  locale: 'ja' | 'en' | string;
}

export async function HoldersPanel({ coinId, chain, contract, symbol, totalSupply, locale }: Props) {
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

  const snapshot = await getLatestHolders(coinId);
  if (!snapshot || !snapshot.holders_jsonb || snapshot.holders_jsonb.length === 0) {
    return (
      <section className="surface p-5 space-y-2">
        <h2 className="section-heading flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{locale === 'ja' ? 'ホルダー分布' : 'Holders distribution'}</h2>
        <p className="text-[11px] text-muted-foreground">
          {locale === 'ja' ? 'オンチェーン取得待ち (cron pending)' : 'Awaiting on-chain ingest.'}
        </p>
      </section>
    );
  }

  const holders = snapshot.holders_jsonb;
  const top10Pct = snapshot.top10_concentration_pct ?? holders.slice(0, 10).reduce((s, h) => s + h.pct, 0);

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{locale === 'ja' ? 'ホルダー分布 Top 10' : 'Top 10 holders'}</h2>
        <span className="text-[10px] text-muted-foreground">{chain} · {symbol.toUpperCase()}</span>
      </div>

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

      <HoldersChart holders={holders.slice(0, 10)} />

      <div className="rounded-lg border border-border bg-subtle divide-y divide-border/60 text-[11px]">
        {holders.slice(0, 10).map((h) => (
          <div key={h.address} className="flex items-center gap-2 px-3 py-1.5">
            <span className="text-muted-foreground w-6">#{h.rank}</span>
            <code className="flex-1 truncate text-foreground/80 font-mono text-[10px]">{h.label ?? h.address}</code>
            <span className="num tabular-nums w-20 text-right">{formatPercent(h.pct, 2)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
