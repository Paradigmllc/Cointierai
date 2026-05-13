/**
 * Aggregated derivatives history (Coinglass).
 * Stubs to empty arrays when COINGLASS_API_KEY is unset.
 */
import { NextResponse } from 'next/server';
import { getFundingHistory, getOpenInterestHistory, getLongShortRatio, getLiquidations24h } from '@/lib/api/coinglass';

export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol') ?? '';
  if (!symbol) return NextResponse.json({ funding: [], oi: [], longshort: [], liquidations: [] });
  const [funding, oi, longshort, liquidations] = await Promise.all([
    getFundingHistory(symbol),
    getOpenInterestHistory(symbol),
    getLongShortRatio(symbol),
    getLiquidations24h(symbol),
  ]);
  return NextResponse.json({ funding, oi, longshort, liquidations });
}
