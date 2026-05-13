'use client';

/**
 * Sparkline — lightweight static SVG 7d price chart.
 *
 * - Pure SVG (no recharts or heavy charting library)
 * - Auto gain/loss coloring (start vs end price)
 * - 100×32px default, intended as a trailing column in data rows
 * - Gradient fill area for soft visual emphasis
 */
interface SparklineProps {
  data: number[] | null | undefined;
  width?: number;
  height?: number;
  /** 自動カラー分けを上書き */
  forceColor?: 'gain' | 'loss' | 'neutral';
  /** Stroke width */
  strokeWidth?: number;
  /** Gradient fill 表示 */
  withFill?: boolean;
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  forceColor,
  strokeWidth = 1.5,
  withFill = true,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div style={{ width, height }} className="text-muted-foreground/30 text-[10px] flex items-center justify-center">
        —
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // gain/loss 自動判定 (start vs end)
  const isGain = data[data.length - 1] >= data[0];
  const colorType = forceColor ?? (isGain ? 'gain' : 'loss');
  const stroke = colorType === 'gain' ? '#16C784' : colorType === 'loss' ? '#EA3943' : '#94A3B8';
  const gradientId = `spark-${colorType}-${width}-${height}`;

  // gradient fill area (CryptoRank 風)
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {withFill && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {withFill && <polygon points={areaPoints} fill={`url(#${gradientId})`} />}
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
