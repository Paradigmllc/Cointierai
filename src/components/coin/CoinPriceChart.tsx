'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type CandlestickData,
  type HistogramData,
} from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinPriceChartProps {
  coinId: string;
  symbol: string;
  height?: number;
}

const INTERVALS = [
  { key: '24h', label: '24H', days: 1 },
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
  { key: '1y', label: '1Y', days: 365 },
  { key: 'max', label: 'MAX', days: 'max' as const },
] as const;
type IntervalKey = (typeof INTERVALS)[number]['key'];

/**
 * High-density OHLC + volume chart powered by lightweight-charts v5.
 * - Theme-aware (light/dark) via next-themes — colors re-applied on toggle.
 * - Data from /api/ohlc/[coinId]?days=N (server-side CoinGecko aggregation + cache).
 * - Interval pills update in place; container DOM is reused for sub-100ms swaps.
 */
export function CoinPriceChart({ coinId, symbol, height = 480 }: CoinPriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const { resolvedTheme } = useTheme();
  const [interval, setInterval] = useState<IntervalKey>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build chart once
  useEffect(() => {
    if (!containerRef.current) return;
    const isDark = resolvedTheme === 'dark';
    const colors = themeColors(isDark);

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: { background: { type: ColorType.Solid, color: colors.bg }, textColor: colors.text },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      rightPriceScale: { borderColor: colors.border, scaleMargins: { top: 0.06, bottom: 0.25 } },
      timeScale: { borderColor: colors.border, timeVisible: true, secondsVisible: false, fixLeftEdge: true },
      crosshair: { mode: 1, vertLine: { color: colors.crosshair }, horzLine: { color: colors.crosshair } },
      autoSize: true,
    });
    chartRef.current = chart;

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
    });
    candleRef.current = candle;

    const vol = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: colors.volume,
    });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volRef.current = vol;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
    };
  }, [height, resolvedTheme]);

  // Load + apply data when interval or coin changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const days = INTERVALS.find((i) => i.key === interval)?.days ?? 30;
    fetch(`/api/ohlc/${coinId}?days=${days}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<{
          candles: Array<{ t: number; o: number; h: number; l: number; c: number }>;
          volumes: Array<{ t: number; v: number }>;
        }>;
      })
      .then((data) => {
        if (cancelled || !candleRef.current || !volRef.current) return;
        const candleData: CandlestickData<Time>[] = data.candles.map((c) => ({
          time: (c.t / 1000) as Time,
          open: c.o,
          high: c.h,
          low: c.l,
          close: c.c,
        }));
        const colors = themeColors(resolvedTheme === 'dark');
        const volData: HistogramData<Time>[] = data.volumes.map((v, i) => {
          const candle = data.candles[i];
          const up = candle ? candle.c >= candle.o : true;
          return {
            time: (v.t / 1000) as Time,
            value: v.v,
            color: up ? colors.volumeUp : colors.volumeDown,
          };
        });
        candleRef.current.setData(candleData);
        volRef.current.setData(volData);
        chartRef.current?.timeScale().fitContent();
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'failed');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coinId, interval, resolvedTheme]);

  return (
    <div className="surface p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="text-[13px] font-semibold">
          {symbol.toUpperCase()} <span className="text-muted-foreground font-normal">/ USD</span>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-muted/60 p-0.5">
          {INTERVALS.map((iv) => (
            <button
              key={iv.key}
              type="button"
              onClick={() => setInterval(iv.key)}
              className={cn(
                'px-2 py-0.5 text-[11px] font-medium rounded transition-colors',
                interval === iv.key
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative" style={{ height }}>
        <div ref={containerRef} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-[12px] text-muted-foreground">
            Chart data unavailable
          </div>
        )}
      </div>
    </div>
  );
}

function themeColors(dark: boolean) {
  return dark
    ? {
        bg: 'transparent',
        text: '#97A0B5',
        grid: 'rgba(255,255,255,0.04)',
        border: 'rgba(255,255,255,0.08)',
        crosshair: '#8B85FF',
        up: '#16C784',
        down: '#EA3943',
        volume: 'rgba(99,91,255,0.35)',
        volumeUp: 'rgba(22,199,132,0.35)',
        volumeDown: 'rgba(234,57,67,0.35)',
      }
    : {
        bg: 'transparent',
        text: '#6B7280',
        grid: 'rgba(0,0,0,0.04)',
        border: 'rgba(0,0,0,0.08)',
        crosshair: '#635BFF',
        up: '#16C784',
        down: '#EA3943',
        volume: 'rgba(99,91,255,0.3)',
        volumeUp: 'rgba(22,199,132,0.35)',
        volumeDown: 'rgba(234,57,67,0.35)',
      };
}
