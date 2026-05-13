/**
 * GlobalStatsBar — CryptoRank.io 風 sticky top bar
 *
 * 表示順 (CryptoRank と同じ):
 *   Currencies XX,XXX → Market Cap $X.XXT → 24h Vol $XX.XXB → BTC Dom XX.X% → ETH Dom XX.X% → ETH Gas X Gwei
 *
 * モバイルでは横スクロール
 */
import { formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';

interface GlobalStatsBarProps {
  global: {
    totalMarketCapUsd: number;
    totalVolume24hUsd: number;
    btcDominance: number;
    ethDominance: number;
    activeCoins: number;
    marketCapChange24h: number;
  } | null;
  ethGasGwei?: number | null;
}

export function GlobalStatsBar({ global, ethGasGwei }: GlobalStatsBarProps) {
  if (!global) return null;

  return (
    <div className="border-b border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="container">
        <div className="flex items-center gap-5 overflow-x-auto thin-scrollbar text-[11px] py-2 whitespace-nowrap">
          <Stat label="Currencies" value={global.activeCoins.toLocaleString()} />
          <Sep />
          <Stat label="Market Cap" value={formatCompact(global.totalMarketCapUsd)} change={global.marketCapChange24h} />
          <Sep />
          <Stat label="24h Spot Volume" value={formatCompact(global.totalVolume24hUsd)} />
          <Sep />
          <span className="text-muted-foreground/60">Dominance:</span>
          <Stat label="BTC" value={`${global.btcDominance.toFixed(2)}%`} dense />
          <Stat label="ETH" value={`${global.ethDominance.toFixed(2)}%`} dense />
          {typeof ethGasGwei === 'number' && (
            <>
              <Sep />
              <Stat label="ETH Gas" value={`${ethGasGwei.toFixed(1)} Gwei`} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Sep() {
  return <span className="text-border/60">·</span>;
}

function Stat({ label, value, change, dense }: { label: string; value: string; change?: number; dense?: boolean }) {
  return (
    <span className={cn('inline-flex items-center', dense ? 'gap-1' : 'gap-1.5')}>
      <span className="text-muted-foreground/60">{label}</span>
      <span className="text-foreground font-medium num tabular-nums">{value}</span>
      {change !== undefined && (
        <span className={cn('num tabular-nums text-[10px]', changeColor(change))}>{formatPercent(change, 2)}</span>
      )}
    </span>
  );
}
