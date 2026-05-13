import { NextRequest, NextResponse } from 'next/server';
import { getOHLC, getMarketChart } from '@/lib/api/coingecko';

/**
 * GET /api/ohlc/[coinId]?days=30
 *
 * Combines two CoinGecko endpoints — OHLC candles + total_volumes from market_chart —
 * because /ohlc doesn't ship volume data. Aligned by nearest-timestamp on the server
 * so the chart client receives ready-to-render arrays.
 *
 * Cache: s-maxage=300, stale-while-revalidate=3600 (5 min fresh, 1h stale OK).
 */
export const revalidate = 300;

function parseDays(raw: string | null): number | 'max' {
  if (raw === 'max') return 'max';
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 30;
  if (n > 1825) return 1825;
  return Math.round(n);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ coinId: string }> }) {
  const { coinId } = await params;
  const days = parseDays(req.nextUrl.searchParams.get('days'));

  try {
    const [ohlc, mc] = await Promise.all([getOHLC(coinId, days), getMarketChart(coinId, days)]);
    const candles = ohlc.map(([t, o, h, l, c]) => ({ t, o, h, l, c }));
    // Align volumes by nearest candle timestamp (CoinGecko intervals don't perfectly match).
    const volumes = candles.map(({ t }) => {
      let nearest = mc.total_volumes[0]?.[1] ?? 0;
      let minDelta = Number.POSITIVE_INFINITY;
      for (const [vt, v] of mc.total_volumes) {
        const delta = Math.abs(vt - t);
        if (delta < minDelta) {
          minDelta = delta;
          nearest = v;
        }
      }
      return { t, v: nearest };
    });
    return NextResponse.json(
      { candles, volumes },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    );
  } catch (e) {
    console.error('[/api/ohlc] err', e);
    return NextResponse.json({ candles: [], volumes: [] }, { status: 500 });
  }
}
