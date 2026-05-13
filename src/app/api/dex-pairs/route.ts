/**
 * DexScreener pair lookup proxy.
 *   /api/dex-pairs?q=BTC  → top 12 pairs by liquidity
 */
import { NextResponse } from 'next/server';
import { getTopPairs } from '@/lib/api/dexscreener';

export const revalidate = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ pairs: [] });
  const pairs = await getTopPairs(q, 24);
  const shaped = pairs.map((p) => ({
    chainId: p.chainId,
    dexId: p.dexId,
    url: p.url,
    pairAddress: p.pairAddress,
    baseSymbol: p.baseToken.symbol,
    quoteSymbol: p.quoteToken.symbol,
    priceUsd: p.priceUsd ? Number(p.priceUsd) : null,
    liquidityUsd: p.liquidity?.usd ?? 0,
    volume24hUsd: p.volume.h24 ?? 0,
    change24h: p.priceChange?.h24 ?? 0,
    buys24h: p.txns.h24.buys,
    sells24h: p.txns.h24.sells,
    fdv: p.fdv ?? null,
  }));
  return NextResponse.json({ pairs: shaped });
}
