'use client';

import { useEffect, useRef, memo } from 'react';

/**
 * TradingView Crypto Heatmap — 市場全体の sentiment 可視化
 * CryptoRank にない要素・「アジア発」差別化に貢献
 */
function HeatmapImpl({ height = 400, locale = 'ja' }: { height?: number; locale?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      dataSource: 'Crypto',
      blockSize: 'market_cap_calc',
      blockColor: 'change',
      locale: locale === 'ja' ? 'ja' : 'en',
      symbolUrl: '',
      colorTheme: 'dark',
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height,
    });
    container.current.appendChild(script);
  }, [height, locale]);

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden">
      <div ref={container} className="w-full" style={{ height }} />
    </div>
  );
}

export const TradingViewHeatmap = memo(HeatmapImpl);
