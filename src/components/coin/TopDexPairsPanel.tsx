/**
 * SSOT-first DEX pairs panel. Reads cointier.dex_pairs (DexScreener ingest).
 */
import { Droplet, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getTopDexPairsForCoin } from '@/lib/db/ssot-queries';
import { formatCompact, formatPercent, cn } from '@/lib/utils';

interface Props {
  coinId: string;
  symbol: string;
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

export async function TopDexPairsPanel({ coinId, symbol, locale }: Props) {
  const pairs = await getTopDexPairsForCoin(coinId, 12);
  if (pairs.length === 0) return null;

  const totalLiquidity = pairs.reduce((s, p) => s + (p.liquidity_usd ?? 0), 0);
  const totalVolume24h = pairs.reduce((s, p) => s + (p.volume_24h_usd ?? 0), 0);

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
          <span className="opacity-60">DexScreener · SSOT</span>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-subtle divide-y divide-border/60">
        {pairs.map((p, i) => {
          const buys = p.txns_24h_buys ?? 0;
          const sells = p.txns_24h_sells ?? 0;
          const total = buys + sells;
          const buyRatio = total > 0 ? buys / total : 0.5;
          return (
            <a
              key={`${p.chain_id}-${p.pair_address}`}
              href={p.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors text-[12px]"
            >
              <span className="text-muted-foreground text-[10px] w-5 tabular-nums">#{i + 1}</span>
              <Badge variant="secondary" className={cn('text-[9px] uppercase shrink-0', CHAIN_COLOR[p.chain_id] ?? '')}>
                {p.chain_id}
              </Badge>
              <span className="text-[10px] text-muted-foreground/80 capitalize w-16 truncate shrink-0">{p.dex_id ?? '—'}</span>
              <span className="font-medium flex-1 truncate">
                {p.base_symbol}/<span className="text-muted-foreground">{p.quote_symbol ?? '?'}</span>
              </span>
              <span className="num tabular-nums w-20 text-right shrink-0">
                {p.price_usd ? `$${p.price_usd < 0.01 ? p.price_usd.toExponential(2) : p.price_usd.toFixed(p.price_usd < 1 ? 6 : 2)}` : '—'}
              </span>
              <span className={cn('num tabular-nums w-14 text-right text-[11px] shrink-0', (p.price_change_24h ?? 0) >= 0 ? 'text-gain' : 'text-loss')}>
                {(p.price_change_24h ?? 0) >= 0 ? '+' : ''}{formatPercent(p.price_change_24h ?? 0, 1)}
              </span>
              <span className="num tabular-nums w-20 text-right shrink-0">${formatCompact(p.liquidity_usd ?? 0)}</span>
              <span className="num tabular-nums w-20 text-right shrink-0">${formatCompact(p.volume_24h_usd ?? 0)}</span>
              <div className="hidden md:flex w-20 h-3 rounded overflow-hidden border border-border/60 shrink-0" title={`${buys} buys / ${sells} sells`}>
                <div className="bg-gain/70 h-full" style={{ width: `${buyRatio * 100}%` }} />
                <div className="bg-loss/70 h-full" style={{ width: `${(1 - buyRatio) * 100}%` }} />
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
