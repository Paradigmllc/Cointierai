'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, ArrowDownUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCompact, cn } from '@/lib/utils';
import { classify, exchangeMeta } from '@/lib/exchanges/registry';
import type { CgTicker } from '@/lib/api/coingecko';

interface TradingPairsPanelProps {
  tickers: CgTicker[];
  locale: string;
}

/**
 * Pair-grouping view that complements MarketsTable.
 * - Aggregates 24h USD volume per quote currency (USDT / USDC / USD / BTC / ETH / JPY / KRW / TRY / EUR / others).
 * - Tabs separate spot venues vs. perpetuals (DEX/AGG/aggregator counted as DEX in this collapse).
 * - Top quotes get a horizontal bar visualization sized to their volume share.
 *
 * Designed to answer "where can I actually trade this and in what quote?"
 * in one glance — something CMC fragments across multiple tabs.
 */
export function TradingPairsPanel({ tickers, locale }: TradingPairsPanelProps) {
  const [tab, setTab] = useState<'spot' | 'perps'>('spot');
  const isJa = locale === 'ja';

  const groups = useMemo(() => {
    // Stable bucketing of perps vs spot by detecting USDT-PERP / -PERP / SWAP / FUT keywords.
    const isPerps = (t: CgTicker) => {
      const target = (t.target ?? '').toUpperCase();
      const base = (t.base ?? '').toUpperCase();
      return /PERP|SWAP|FUT|USD-PERP|-P$/.test(target) || /PERP|SWAP|FUT|-P$/.test(base);
    };

    const filtered = tickers.filter((t) => !t.is_stale && !t.is_anomaly);
    const list = tab === 'perps' ? filtered.filter(isPerps) : filtered.filter((t) => !isPerps(t));

    const byQuote = new Map<string, { count: number; volume: number; venues: Set<string> }>();
    for (const t of list) {
      const quote = normalizeQuote(t.target);
      const cur = byQuote.get(quote) ?? { count: 0, volume: 0, venues: new Set<string>() };
      cur.count += 1;
      cur.volume += t.converted_volume?.usd ?? 0;
      cur.venues.add(t.market.identifier);
      byQuote.set(quote, cur);
    }
    return [...byQuote.entries()]
      .map(([quote, v]) => ({ quote, ...v, venues: [...v.venues] }))
      .sort((a, b) => b.volume - a.volume);
  }, [tickers, tab]);

  const totalVolume = groups.reduce((s, g) => s + g.volume, 0);

  return (
    <section className="surface p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2">
          <ArrowDownUp className="h-4 w-4 text-primary" />
          {isJa ? 'クォート通貨別の取引ペア' : 'Trading pairs by quote'}
          <Badge variant="outline" className="text-[9px] py-0">{tickers.length} {isJa ? 'ペア合計' : 'pairs'}</Badge>
        </h2>
        <div className="flex items-center gap-1 rounded-md bg-muted/60 p-0.5">
          {(['spot', 'perps'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                'px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors uppercase',
                tab === k ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {k === 'spot' ? (isJa ? '現物' : 'Spot') : (isJa ? '永続' : 'Perps')}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-[12px] text-muted-foreground py-4 text-center">
          {tab === 'perps'
            ? (isJa ? '永続取引のペアは見つかりませんでした' : 'No perpetual pairs found')
            : (isJa ? '現物取引のペアは見つかりませんでした' : 'No spot pairs found')}
        </p>
      ) : (
        <div className="space-y-1.5">
          {groups.slice(0, 12).map((g) => {
            const sharePct = totalVolume > 0 ? (g.volume / totalVolume) * 100 : 0;
            const quoteMeta = QUOTE_META[g.quote] ?? { color: 'rgba(99,91,255,0.7)', label: g.quote };
            return (
              <div key={g.quote} className="rounded-lg border border-border bg-subtle p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ background: quoteMeta.color }}
                    />
                    <span className="font-semibold text-[13px]">{quoteMeta.label}</span>
                    <Badge variant="outline" className="text-[9px] py-0">{g.count} {isJa ? 'ペア' : 'pairs'}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="num tabular-nums font-semibold text-[12px]">{formatCompact(g.volume)}</span>
                    <span className="text-[10px] text-muted-foreground w-12 tabular-nums">{sharePct.toFixed(1)}%</span>
                  </div>
                </div>
                {/* Share bar */}
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${Math.min(100, sharePct)}%`, background: quoteMeta.color }}
                  />
                </div>
                {/* Top venues */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {g.venues.slice(0, 6).map((id) => (
                    <VenueChip key={id} cgId={id} tickers={tickers} />
                  ))}
                  {g.venues.length > 6 && (
                    <span className="text-[10px] text-muted-foreground self-center">+{g.venues.length - 6}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-border/50">
        {isJa
          ? '※ CoinGecko 由来の live ペア集計 · 24h Volume USD 換算 · 5 分キャッシュ'
          : '※ Live pair aggregation via CoinGecko · 24h USD-converted volume · 5-min cache'}
      </p>
    </section>
  );
}

function VenueChip({ cgId, tickers }: { cgId: string; tickers: CgTicker[] }) {
  const t = tickers.find((x) => x.market.identifier === cgId);
  const name = exchangeMeta(cgId).name ?? t?.market.name ?? cgId;
  const kind = classify(cgId);
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-card text-[10px]">
      {t?.market.logo ? (
        <Image src={t.market.logo} alt={name} width={12} height={12} className="rounded-full" unoptimized />
      ) : (
        <span className="inline-block w-3 h-3 rounded-full bg-muted text-[8px] flex items-center justify-center font-semibold">
          {name[0]?.toUpperCase()}
        </span>
      )}
      <span className="truncate max-w-[120px]">{name}</span>
      {kind !== 'cex' && <span className="text-[8px] text-muted-foreground uppercase">{kind === 'dex' ? 'DEX' : 'AGG'}</span>}
    </span>
  );
}

/**
 * Quote currency normalization — CoinGecko reports raw target tokens
 * which need collapsing (e.g. USDT / USDC / USDE all share the same role).
 */
function normalizeQuote(target: string): string {
  const t = (target ?? '').toUpperCase();
  if (t === 'USDT' || t === 'USDC' || t === 'USD' || t === 'BUSD' || t === 'TUSD' || t === 'FDUSD' || t === 'DAI' || t === 'USDE') return t;
  if (t === 'BTC' || t === 'WBTC' || t === 'TBTC') return 'BTC';
  if (t === 'ETH' || t === 'WETH' || t === 'STETH') return 'ETH';
  if (t === 'JPY') return 'JPY';
  if (t === 'KRW') return 'KRW';
  if (t === 'EUR') return 'EUR';
  if (t === 'GBP') return 'GBP';
  if (t === 'TRY') return 'TRY';
  if (t === 'BRL') return 'BRL';
  if (t === 'SOL') return 'SOL';
  return t || 'OTHER';
}

const QUOTE_META: Record<string, { color: string; label: string }> = {
  USDT: { color: '#26A17B', label: 'USDT' },
  USDC: { color: '#2775CA', label: 'USDC' },
  USD: { color: '#16C784', label: 'USD' },
  USDE: { color: '#5E5ADB', label: 'USDe' },
  DAI: { color: '#F5AC37', label: 'DAI' },
  FDUSD: { color: '#0096FF', label: 'FDUSD' },
  BTC: { color: '#F7931A', label: 'BTC' },
  ETH: { color: '#627EEA', label: 'ETH' },
  SOL: { color: '#9945FF', label: 'SOL' },
  JPY: { color: '#BC002D', label: 'JPY' },
  KRW: { color: '#003478', label: 'KRW' },
  EUR: { color: '#003399', label: 'EUR' },
  TRY: { color: '#E30A17', label: 'TRY' },
  BRL: { color: '#FFDF00', label: 'BRL' },
};
