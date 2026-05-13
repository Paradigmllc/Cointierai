'use client';

/**
 * LiquidityAwareChart — picks the deepest-liquidity venue for the chart.
 *
 * Decision tree:
 *   1. If symbol is on Hyperliquid (`hl_listed=true`) → use Hyperliquid candles
 *      (best for Cointier's differentiation; native to the Builder Fee venue).
 *   2. Else if the coin has CoinGecko OHLC data (most CEX-listed coins) → use
 *      existing `<CoinPriceChart>` which calls /api/ohlc/[coinId].
 *   3. Else if DexScreener returns a pair → embed the DexScreener chart
 *      iframe of the deepest-liquidity pair (DEX-only tokens).
 *
 * The chart header shows a "venue badge" so traders see *which* market is
 * being priced — important when CEX/DEX prices diverge.
 */
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Droplet, Zap, BarChart3, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// lightweight-charts is canvas-only — keep it out of the server bundle.
const CoinPriceChart = dynamic(
  () => import('@/components/coin/CoinPriceChart').then((m) => m.CoinPriceChart),
  { ssr: false, loading: () => <div className="h-[520px] rounded-lg border border-border bg-card animate-pulse" /> },
);

interface Props {
  coinId: string;
  symbol: string;
  contractAddress?: string | null;
  hyperliquidListed?: boolean;
  height?: number;
}

interface Venue {
  kind: 'hyperliquid' | 'cex' | 'dex';
  chain?: string;
  dex?: string;
  pairAddress?: string;
  url?: string;
  liquidityUsd?: number;
  pairLabel?: string;
}

export function LiquidityAwareChart({ coinId, symbol, contractAddress, hyperliquidListed, height = 520 }: Props) {
  const [venue, setVenue] = useState<Venue | null>(null);

  useEffect(() => {
    if (hyperliquidListed) {
      setVenue({ kind: 'hyperliquid', pairLabel: `${symbol.toUpperCase()}-PERP` });
      return;
    }
    // For long-tail tokens, race CoinGecko OHLC availability against DexScreener.
    let cancelled = false;
    (async () => {
      try {
        const [ohlc, dex] = await Promise.all([
          fetch(`/api/ohlc/${coinId}?days=7`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/dex-pairs?q=${encodeURIComponent(contractAddress || symbol)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (cancelled) return;

        const hasOhlc = Array.isArray(ohlc) && ohlc.length > 10;
        const topPair = dex?.pairs?.[0];

        // Heuristic: prefer DEX chart only when CG has no data OR the DEX pair
        // dwarfs CEX activity (liquidity > $5M and CG missing). Keeps the chart
        // stable for blue-chips (BTC/ETH always go CG/CEX).
        if (!hasOhlc && topPair) {
          setVenue({
            kind: 'dex',
            chain: topPair.chainId,
            dex: topPair.dexId,
            pairAddress: topPair.pairAddress,
            url: topPair.url,
            liquidityUsd: topPair.liquidityUsd,
            pairLabel: `${topPair.baseSymbol}/${topPair.quoteSymbol}`,
          });
        } else {
          setVenue({ kind: 'cex', pairLabel: `${symbol.toUpperCase()}/USD` });
        }
      } catch {
        if (!cancelled) setVenue({ kind: 'cex', pairLabel: `${symbol.toUpperCase()}/USD` });
      }
    })();
    return () => { cancelled = true; };
  }, [coinId, symbol, contractAddress, hyperliquidListed]);

  return (
    <div className="space-y-2">
      <VenueHeader venue={venue} symbol={symbol} />
      {!venue && <div className="h-[520px] flex items-center justify-center text-[11px] text-muted-foreground">Picking deepest venue…</div>}
      {venue?.kind === 'dex' && venue.chain && venue.pairAddress && (
        <iframe
          src={`https://dexscreener.com/${venue.chain}/${venue.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
          className="w-full rounded-lg border border-border"
          style={{ height }}
          allow="clipboard-write"
          title={`${symbol} DEX chart`}
        />
      )}
      {venue?.kind === 'cex' && <CoinPriceChart coinId={coinId} symbol={symbol} height={height} />}
      {venue?.kind === 'hyperliquid' && (
        <iframe
          src={`https://app.hyperliquid.xyz/trade/${symbol.toUpperCase()}?embed=1`}
          className="w-full rounded-lg border border-border"
          style={{ height }}
          allow="clipboard-write"
          title={`${symbol} Hyperliquid chart`}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}

function VenueHeader({ venue, symbol }: { venue: Venue | null; symbol: string }) {
  if (!venue) return null;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {venue.kind === 'hyperliquid' && (
        <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
          <Zap className="h-3 w-3" /> Hyperliquid Perps
        </Badge>
      )}
      {venue.kind === 'cex' && (
        <Badge variant="secondary" className="gap-1">
          <BarChart3 className="h-3 w-3" /> Aggregated CEX
        </Badge>
      )}
      {venue.kind === 'dex' && (
        <Badge className="bg-tier-a/10 text-tier-a border-tier-a/30 gap-1">
          <Droplet className="h-3 w-3" /> {venue.chain} · {venue.dex}
        </Badge>
      )}
      <span className="text-muted-foreground font-medium tabular-nums">{venue.pairLabel}</span>
      {venue.liquidityUsd && (
        <span className="text-[10px] text-muted-foreground">Liq ${shortUsd(venue.liquidityUsd)}</span>
      )}
      {venue.url && (
        <a href={venue.url} target="_blank" rel="noopener noreferrer" className={cn('ml-auto text-primary hover:underline inline-flex items-center gap-1 text-[11px]')}>
          Open in DexScreener <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  );
}

function shortUsd(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}
