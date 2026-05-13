/**
 * PriceRangeSlider — CryptoRank.io /price/{coin} ページ "Price Range" 24H 帯
 *
 * 構造:  Low 24H ◀━━━━●━━━━▶ High 24H
 *        $79,946             $81,262
 *
 * current 値を Low-High 間のバーで可視化.
 */
import { formatPrice, cn } from '@/lib/utils';

interface PriceRangeSliderProps {
  low: number | null | undefined;
  high: number | null | undefined;
  current: number | null | undefined;
  label?: string;
}

export function PriceRangeSlider({ low, high, current, label = '24H' }: PriceRangeSliderProps) {
  if (low == null || high == null || current == null) return null;
  const range = high - low || 1;
  const pct = Math.max(0, Math.min(100, ((current - low) / range) * 100));
  return (
    <div className="w-full max-w-[260px] space-y-1.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Low {label}</span>
        <span className="text-[10px] font-medium tracking-wider text-foreground">{label}</span>
        <span>High {label}</span>
      </div>
      <div className="relative h-1 bg-muted/60 rounded-full">
        <div
          className="absolute h-1 rounded-full bg-gradient-to-r from-loss/40 via-foreground/40 to-gain/40"
          style={{ left: 0, right: 0 }}
        />
        <div
          className={cn('absolute -top-1 h-3 w-3 rounded-full bg-primary border-2 border-background')}
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] num tabular-nums font-medium">
        <span>{formatPrice(low)}</span>
        <span>{formatPrice(high)}</span>
      </div>
    </div>
  );
}
