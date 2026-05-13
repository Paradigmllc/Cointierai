'use client';

import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: 'gain' | 'loss' | 'auto';
}

/**
 * Pure SVG sparkline — recharts ナシで超軽量 (table 行内表示用)
 *
 * CryptoRank の table に sparkline がある UI を真似る。
 * data は 7d / 30d の価格点列 (CoinGecko sparkline endpoint から取得)
 */
export function Sparkline({ data, width = 100, height = 30, color = 'auto' }: SparklineProps) {
  const path = useMemo(() => {
    if (!data?.length) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1 || 1);
    const points = data.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return points.join(' ');
  }, [data, width, height]);

  if (!path || !data?.length) {
    return <div className="text-muted-foreground/30 text-[10px] text-center" style={{ width, height }}>—</div>;
  }

  const isGain = data[data.length - 1] >= data[0];
  const stroke = color === 'auto' ? (isGain ? '#16C784' : '#EA3943') : color === 'gain' ? '#16C784' : '#EA3943';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
