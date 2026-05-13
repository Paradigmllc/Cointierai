'use client';

import { useEffect, useRef, memo } from 'react';

/**
 * TradingView Ticker Tape — ホーム上部の流れる価格ティッカー
 * CryptoRank / CMC のトップにある「BTC 65,432 +1.5%」が左から右に流れる UI
 */
function TickerTapeImpl({ locale = 'ja' }: { locale?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'BINANCE:BTCUSDT', title: 'BTC' },
        { proName: 'BINANCE:ETHUSDT', title: 'ETH' },
        { proName: 'BINANCE:SOLUSDT', title: 'SOL' },
        { proName: 'BINANCE:BNBUSDT', title: 'BNB' },
        { proName: 'BINANCE:XRPUSDT', title: 'XRP' },
        { proName: 'BINANCE:DOGEUSDT', title: 'DOGE' },
        { proName: 'BINANCE:ADAUSDT', title: 'ADA' },
        { proName: 'BINANCE:AVAXUSDT', title: 'AVAX' },
        { proName: 'BINANCE:LINKUSDT', title: 'LINK' },
        { proName: 'BINANCE:DOTUSDT', title: 'DOT' },
        { proName: 'BINANCE:MATICUSDT', title: 'MATIC' },
        { proName: 'BINANCE:NEARUSDT', title: 'NEAR' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: locale === 'ja' ? 'ja' : 'en',
    });
    container.current.appendChild(script);
  }, [locale]);

  return <div ref={container} className="w-full border-b border-border/30" />;
}

export const TradingViewTickerTape = memo(TickerTapeImpl);
