'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  /** 銘柄 symbol (BTC / ETH 等) — exchange prefix なし */
  symbol: string;
  /** 取引所 (default: BINANCE) — BTC は BINANCE:BTCUSDT 形式 */
  exchange?: 'BINANCE' | 'COINBASE' | 'BYBIT' | 'OKX' | 'BITSTAMP';
  /** Quote currency */
  quote?: 'USDT' | 'USD' | 'BUSD';
  /** チャート高さ */
  height?: number;
  /** Locale */
  locale?: string;
  /** インターバル */
  interval?: '1' | '5' | '15' | '60' | '240' | 'D' | 'W' | 'M';
}

/**
 * TradingView Advanced Chart Widget — 商用無料・帰属表示不要
 * https://www.tradingview.com/widget/advanced-chart/
 *
 * CoinGecko / CryptoRank がやっているのと同じ。
 * BTC のチャートは BINANCE:BTCUSDT で取得可能。
 */
function TradingViewChartImpl({
  symbol,
  exchange = 'BINANCE',
  quote = 'USDT',
  height = 500,
  locale = 'ja',
  interval = 'D',
}: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const tvSymbol = `${exchange}:${symbol.toUpperCase()}${quote}`;
    const localeMap: Record<string, string> = { ja: 'ja', en: 'en', th: 'th_TH', vi: 'vi_VN', id: 'id_ID', 'zh-TW': 'zh_TW', ko: 'kr' };
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval,
      timezone: 'Asia/Tokyo',
      theme: 'dark',
      style: '1',
      locale: localeMap[locale] ?? 'en',
      enable_publishing: false,
      backgroundColor: 'rgba(11, 14, 22, 1)',
      gridColor: 'rgba(42, 47, 61, 0.5)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      allow_symbol_change: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    });
    container.current.appendChild(script);
  }, [symbol, exchange, quote, interval, locale]);

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden">
      <div ref={container} className="tradingview-widget-container" style={{ height, width: '100%' }} />
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartImpl);
