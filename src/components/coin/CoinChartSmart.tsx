'use client';

import { useEffect, useState } from 'react';
import { TradingViewChart } from './TradingViewChart';
import { Sparkline } from './Sparkline';

import { useTranslations } from 'next-intl';
/**
 * CoinChartSmart — TradingView と CoinGecko の自動切替
 *
 * 問題: TradingView は CEX (Binance/Bybit/OKX 等) に listed な symbol しか chart 取得不可.
 *       BILLUSDT のような non-listed coin だと "このシンボルは存在しません" 表示.
 *
 * 解決:
 *   1. MAJOR_SYMBOLS のホワイトリストに該当 → TradingView Advanced Chart
 *   2. その他 → CoinGecko sparkline 配列 (7d/30d/90d) を Recharts で描画
 */

/**
 * Binance USDT pair listed 主要銘柄 (verified 2026-05).
 * このリスト外は CoinGecko sparkline fallback を使う.
 */
const TRADINGVIEW_LISTED = new Set([
  'btc', 'eth', 'bnb', 'sol', 'xrp', 'doge', 'ada', 'avax', 'dot', 'matic',
  'link', 'ltc', 'bch', 'shib', 'trx', 'uni', 'atom', 'etc', 'xlm', 'near',
  'apt', 'arb', 'op', 'fil', 'hbar', 'inj', 'icp', 'imx', 'ldo', 'mkr',
  'pepe', 'wif', 'sui', 'stx', 'rune', 'algo', 'render', 'aave', 'sand',
  'mana', 'flow', 'theta', 'xtz', 'chz', 'crv', 'cake', 'snx', 'comp',
  'tia', 'sei', 'celo', 'mina', 'kava', 'fxs', 'rndr', 'ftm', 'gmt',
  'jup', 'jto', 'pyth', 'ondo', 'tao', 'ena', 'wld', 'eigen',
]);

interface CoinChartSmartProps {
  symbol: string;
  /** 7d / 30d / 90d 価格配列 (CoinGecko sparkline_in_7d 等) */
  sparkline?: number[] | null;
  height?: number;
  locale?: string;
  /** CoinGecko coin id (fallback chart 用) */
  coinId?: string;
}

interface ChartPoint {
  t: number;
  p: number;
}

export function CoinChartSmart({ symbol, sparkline, height = 500, locale = 'ja', coinId }: CoinChartSmartProps) {
  const sym = symbol.toLowerCase();
  const isMajor = TRADINGVIEW_LISTED.has(sym);

  // Major listed → TradingView
  if (isMajor) {
    return <TradingViewChart symbol={sym} locale={locale} height={height} />;
  }

  // Fallback: CoinGecko price chart via market_chart endpoint
  return <CoinGeckoChart coinId={coinId ?? sym} sparkline={sparkline} height={height} locale={locale} />;
}

/**
 * Lightweight chart for non-CEX-listed coins.
 *  - sparkline_in_7d (168 hourly points) を即時表示
 *  - 別途 /coins/{id}/market_chart?days=30 を client 側で fetch して line chart 描画
 */
function CoinGeckoChart({
  coinId,
  sparkline,
  height,
  locale,
}: {
  coinId: string;
  sparkline?: number[] | null;
  height: number;
  locale: string;
}) {
  const [data, setData] = useState<ChartPoint[] | null>(null);
  const [days, setDays] = useState<7 | 30 | 90 | 365>(30);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`, {
      headers: { 'Accept': 'application/json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`CG ${r.status}`);
        return r.json();
      })
      .then((j: { prices?: [number, number][] }) => {
        if (cancelled) return;
        const pts: ChartPoint[] = (j.prices ?? []).map(([t, p]) => ({ t, p }));
        setData(pts);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        // Use sparkline as final fallback
        if (sparkline && sparkline.length > 0) {
          const now = Date.now();
          const span = days * 86_400_000;
          const pts: ChartPoint[] = sparkline.map((p, i) => ({
            t: now - span + (i / sparkline.length) * span,
            p,
          }));
          setData(pts);
        } else {
          setError(e instanceof Error ? e.message : 'failed');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coinId, days, sparkline]);

  const tT = useTranslations();

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 text-xs">
        <div className="text-muted-foreground">
          {tT('coinChart.priceChart')}
          <span className="ml-2 text-[10px] opacity-60">via CoinGecko</span>
        </div>
        <div className="flex items-center gap-1">
          {([7, 30, 90, 365] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                days === d ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {d === 365 ? '1Y' : `${d}D`}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height }} className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
            {tT('dashWatchlist.loading')}
          </div>
        )}
        {!loading && error && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
            {tT('coinChart.chartDataUnavailable')}
          </div>
        )}
        {!loading && data && data.length > 1 && (
          <ResponsiveSparkline data={data.map((p) => p.p)} height={height} />
        )}
      </div>
    </div>
  );
}

/** Full-width sparkline filling parent container */
function ResponsiveSparkline({ data, height }: { data: number[]; height: number }) {
  return (
    <div className="absolute inset-0 p-4">
      <Sparkline data={data} width={1200} height={height - 32} strokeWidth={1.8} withFill />
    </div>
  );
}
