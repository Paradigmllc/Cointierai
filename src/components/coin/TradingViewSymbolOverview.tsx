'use client';

import { useEffect, useRef, memo } from 'react';

import { useTranslations } from 'next-intl';
interface TradingViewSymbolOverviewProps {
  symbol: string;
  exchange?: string;
  quote?: string;
  height?: number;
  locale?: string;
}

/**
 * TradingView Symbol Overview — 中型チャート (Mini と Advanced の中間)
 */
function TradingViewSymbolOverviewImpl({
  symbol,
  exchange = 'BINANCE',
  quote = 'USDT',
  height = 220,
  locale = 'ja',
}: TradingViewSymbolOverviewProps) {
  const tT = useTranslations();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const tvSymbol = `${exchange}:${symbol.toUpperCase()}${quote}`;
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [[symbol.toUpperCase(), tvSymbol]],
      chartOnly: false,
      width: '100%',
      height,
      locale: tT('cointvHeatmap.en'),
      colorTheme: 'dark',
      autosize: false,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: true,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '10',
      noTimeScale: false,
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      chartType: 'area',
      maLineColor: '#2962FF',
      maLineWidth: 1,
      maLength: 9,
      lineColor: 'rgba(59, 130, 246, 1)',
      bottomColor: 'rgba(59, 130, 246, 0)',
      topColor: 'rgba(59, 130, 246, 0.3)',
      isTransparent: true,
      backgroundColor: 'rgba(11, 14, 22, 0)',
      dateRanges: ['1d|15', '1w|60', '1m|240', '3m|D', '12m|D', '60m|W'],
    });
    container.current.appendChild(script);
  }, [symbol, exchange, quote, height, locale]);

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden">
      <div ref={container} className="w-full" style={{ height }} />
    </div>
  );
}

export const TradingViewSymbolOverview = memo(TradingViewSymbolOverviewImpl);
