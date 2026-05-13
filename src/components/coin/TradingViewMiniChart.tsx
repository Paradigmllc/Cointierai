'use client';

import { useEffect, useRef, memo } from 'react';

import { useTranslations } from 'next-intl';
interface TradingViewMiniChartProps {
  symbol: string;
  exchange?: string;
  quote?: string;
  height?: number;
  locale?: string;
}

/**
 * TradingView Mini Symbol Widget — sparkline 風小チャート
 * CoinsTable の行内に埋め込む用 (Notion で CryptoRank UI 風)
 */
function TradingViewMiniChartImpl({
  symbol,
  exchange = 'BINANCE',
  quote = 'USDT',
  height = 60,
  locale = 'ja',
}: TradingViewMiniChartProps) {
  const tT = useTranslations();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const tvSymbol = `${exchange}:${symbol.toUpperCase()}${quote}`;
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      width: '100%',
      height,
      locale: tT('cointvHeatmap.en'),
      dateRange: '12M',
      colorTheme: 'dark',
      trendLineColor: 'rgba(59, 130, 246, 1)',
      underLineColor: 'rgba(59, 130, 246, 0.3)',
      underLineBottomColor: 'rgba(59, 130, 246, 0)',
      isTransparent: true,
      autosize: false,
      largeChartUrl: '',
      noTimeScale: true,
      chartOnly: true,
    });
    container.current.appendChild(script);
  }, [symbol, exchange, quote, height, locale]);

  return <div ref={container} className="w-full" style={{ height }} />;
}

export const TradingViewMiniChart = memo(TradingViewMiniChartImpl);
