/**
 * Global search proxy with Meilisearch + CoinGecko fallback.
 *
 * Backend priority:
 *   1. Meilisearch (typo-tolerant, sub-30ms) — when MEILISEARCH_HOST is set
 *      and the server is reachable. We index coins/exchanges/categories via
 *      scripts/meili-index.ts on a daily cron.
 *   2. CoinGecko /search (default) — slower & no typo tolerance but always
 *      available with no infra needed.
 *
 * Both backends return the same shape so the client (<GlobalSearch>) doesn't
 * care which one served the request. The `meili: boolean` field in the
 * response tells the UI whether to show a "fast search" badge.
 */
import { NextResponse } from 'next/server';
import { searchCoins } from '@/lib/api/coingecko';
import { meiliMultiSearch } from '@/lib/api/meilisearch';
import { rateLimit, getClientKey } from '@/lib/rate-limit';

export const runtime = 'edge';
export const revalidate = 60;

export async function GET(req: Request) {
  const decision = rateLimit(`search:${getClientKey(req)}`, { capacity: 30, refillPerSecond: 1 });
  if (!decision.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(decision.resetMs / 1000)) } });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ coins: [], exchanges: [], categories: [], nfts: [], meili: false });

  // 1. Try Meilisearch first
  const meili = await meiliMultiSearch(q);
  if (meili?.available) {
    return NextResponse.json(
      {
        coins: meili.coins.map((c) => ({
          id: c.id,
          name: c.name,
          api_symbol: c.symbol,
          symbol: c.symbol,
          market_cap_rank: c.market_cap_rank,
          thumb: c.image,
          large: c.image,
        })),
        exchanges: meili.exchanges.map((e) => ({
          id: e.id,
          name: e.name,
          market_type: e.market_type,
          thumb: e.image,
        })),
        categories: meili.categories.map((c) => ({ id: Number(c.id) || c.id, name: c.name })),
        nfts: [],
        meili: true,
        ms: meili.ms,
      },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
    );
  }

  // 2. CoinGecko fallback
  try {
    const result = await searchCoins(q);
    return NextResponse.json(
      { ...result, meili: false },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
    );
  } catch (e) {
    console.error('[search] error', e);
    return NextResponse.json({ coins: [], exchanges: [], categories: [], nfts: [], meili: false }, { status: 200 });
  }
}
