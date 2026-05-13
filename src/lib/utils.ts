import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Tier } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 価格フォーマット — 桁数に応じて精度を変える
 *  $100,000.00       (large)
 *  $1.2345           (mid)
 *  $0.00001234       (small)
 *  $0.000000123      (subcent → 有効桁 4)
 */
export function formatPrice(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const symbol = currency === 'USD' ? '$' : currency === 'JPY' ? '¥' : '';
  if (value >= 1) {
    return symbol + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (value >= 0.01) {
    return symbol + value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
  if (value === 0) return symbol + '0';
  // subcent: 4 有効桁
  return symbol + value.toLocaleString('en-US', { maximumSignificantDigits: 4 });
}

/**
 * Compact 形式 ($1.2B, $456M, $7.8K) — CryptoRank.io と同じ表記
 */
export function formatCompact(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const symbol = currency === 'USD' ? '$' : '';
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${symbol}${(value / 1e3).toFixed(2)}K`;
  return `${symbol}${value.toFixed(2)}`;
}

/**
 * パーセント変化 ( +12.34% / -5.67% )
 */
export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Supply フォーマット (1,234,567 BTC / 21M BTC 等)
 */
export function formatSupply(value: number | null | undefined, symbol: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B ${symbol}`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M ${symbol}`;
  if (value >= 1e3) return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${symbol}`;
  return `${value.toFixed(0)} ${symbol}`;
}

/**
 * Tier 色 (Tailwind class) — tier.s/a/b/c/d/f カラーに対応
 */
export function tierColor(tier: Tier | null | undefined): string {
  switch (tier) {
    case 'S': return 'text-tier-s border-tier-s/40 bg-tier-s/10';
    case 'A': return 'text-tier-a border-tier-a/40 bg-tier-a/10';
    case 'B': return 'text-tier-b border-tier-b/40 bg-tier-b/10';
    case 'C': return 'text-tier-c border-tier-c/40 bg-tier-c/10';
    case 'D': return 'text-tier-d border-tier-d/40 bg-tier-d/10';
    case 'F': return 'text-tier-f border-tier-f/40 bg-tier-f/10';
    default:  return 'text-muted-foreground border-border bg-muted/30';
  }
}

/**
 * Change カラー (gain / loss)
 */
export function changeColor(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'text-muted-foreground';
  if (value > 0) return 'text-gain';
  if (value < 0) return 'text-loss';
  return 'text-muted-foreground';
}

/**
 * 帰属表示文字列の生成 (規約遵守: CoinGecko / CryptoRank etc)
 */
export function attributionString(sources: string[]): string {
  return `Data provided by ${sources.join(', ')}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
