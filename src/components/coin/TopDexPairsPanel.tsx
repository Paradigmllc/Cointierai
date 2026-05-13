'use client';

/**
 * TopDexPairsPanel — surfaces the deepest-liquidity DEX pools for a symbol.
 *
 * Why it matters: for long-tail coins (DePIN / RWA / mid-cap alts) CEX prices
 * lag DEX by minutes. Showing where actual liquidity lives, and the live
 * priceUsd of the deepest pool, gives traders the same edge that pro tools
 * (DexTools, GMGN) charge for.
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Droplet, ExternalLink, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCompact, formatPercent, cn } from '@/lib/utils';

interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseSymbol: string;
  quoteSymbol: string;
  priceUsd: number | null;
  liquidityUsd: number;
  volume24hUsd: number;
  change24h: number;
  buys24h: number;
  sells24h: number;
  fdv: number | null;
}

interface Props {
  symbol: string;
  contractAddress?: string | null;
  locale: 'ja' | 'en' | string;
}

const CHAIN_COLOR: Record<string, string> = {
  ethereum: 'bg-[#627EEA]/15 text-[#627EEA]',
  solana: 'bg-[#9945FF]/15 text-[#9945FF]',
  bsc: 'bg-[#F0B90B]/15 text-[#F0B90B]',
  base: 'bg-[#0052FF]/15 text-[#0052FF]',
  arbitrum: 'bg-[#28A0F0]/15 text-[#28A0F0]',
  polygon: 'bg-[#8247E5]/15 text-[#8247E5]',
  optimism: 'bg-[#FF0420]/15 text-[#FF0420]',
};

export function TopDexPairsPanel({ symbol, contractAddress, locale }: Props) {
  const [pairs, setPairs] = useState<DexPair[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = contractAddress || symbol;
      const res = await fetch(`/api/dex-pairs?q=${encodeURIComponent(q)}`).catch(() => null);
      if (!res || !res.ok) {
        if (!cancelled) setPairs([]);
        return;
      }
      const { pairs } = (await res.json()) as { pairs: DexPair[] };
      if (!cancelled) setPairs(pairs);
    })();
    return () => { cancelled = true; };
  }, [symbol, contractAddress]);

  if (pairs && pairs.length === 0) return null;

  const totalLiquidity = pairs?.reduce((s, p) => s + p.liquidityUsd, 0) ?? 0;
  const totalVolume24h = pairs?.reduce((s, p) => s + p.volume24hUsd, 0) ?? 0;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2">
          <Droplet className="h-4 w-4 text-primary" />
          {locale === 'ja' ? 'DEX 取引ペア (流動性順)' : 'DEX pairs by liquidity'}
        </h2>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>Σ ${formatCompact(totalLiquidity)} liq</span>
          <span>Σ ${formatCompact(totalVolume24h)} 24h vol</span>
          <span className="opacity-60">DexScreener</span>
        </div>
      </div>
      {!pairs && <div className="py-8 text-center text-[11px] text-muted-foreground">Loading…</div>}
      {pairs && pairs.length > 0 && (
        <div className="rounded-lg border border-border bg-subtle divide-y divide-border/60">
          {pairs.slice(0, 12).map((p, i) => {
            const total = p.buys24h + p.sells24h;
            const buyRatio = total > 0 ? p.buys24h / total : 0.5;
            return (
              <a
                key={`${p.chainId}-${p.pairAddress}`}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors text-[12px]"
              >
                <span className="text-muted-foreground text-[10px] w-5 tabular-nums">#{i + 1}</span>
                <Badge variant="secondary" className={cn('text-[9px] uppercase shrink-0', CHAIN_COLOR[p.chainId] ?? '')}>
                  {p.chainId}
                </Badge>
                <span className="text-[10px] text-muted-foreground/80 capitalize w-16 truncate shrink-0">{p.dexId}</span>
                <span className="font-medium flex-1 truncate">
                  {p.baseSymbol}/<span className="text-muted-foreground">{p.quoteSymbol}</span>
                </span>
                <span className="num tabular-nums w-20 text-right shrink-0">
                  {p.priceUsd ? `$${p.priceUsd < 0.01 ? p.priceUsd.toExponential(2) : p.priceUsd.toFixed(p.priceUsd < 1 ? 6 : 2)}` : '—'}
                </span>
                <span className={cn('num tabular-nums w-14 text-right text-[11px] shrink-0', p.change24h >= 0 ? 'text-gain' : 'text-loss')}>
                  {p.change24h >= 0 ? '+' : ''}{formatPercent(p.change24h, 1)}
                </span>
                <span className="num tabular-nums w-20 text-right shrink-0">${formatCompact(p.liquidityUsd)}</span>
                <span className="num tabular-nums w-20 text-right shrink-0">${formatCompact(p.volume24hUsd)}</span>
                {/* Buy/sell pressure bar */}
                <div className="hidden md:flex w-20 h-3 rounded overflow-hidden border border-border/60 shrink-0" title={`${p.buys24h} buys / ${p.sells24h} sells`}>
                  <div className="bg-gain/70 h-full" style={{ width: `${buyRatio * 100}%` }} />
                  <div className="bg-loss/70 h-full" style={{ width: `${(1 - buyRatio) * 100}%` }} />
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
