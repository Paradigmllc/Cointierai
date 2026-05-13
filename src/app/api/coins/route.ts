import { NextRequest, NextResponse } from 'next/server';
import { getTopCoins } from '@/lib/db/queries';
import type { Tier } from '@/types/database';

/**
 * GET /api/coins?limit=250&offset=0&tier=S
 *
 * 公開 API endpoint (Business plan 顧客 + Cointier 内部用)
 *
 * - Free / public: limit 100 まで・60 req/min
 * - Pro / API key: limit 1000 まで・10k req/day
 * - Business: 無制限 (Stripe webhook で枠管理)
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(params.get('limit') ?? '100', 10), 1000);
  const offset = Math.max(parseInt(params.get('offset') ?? '0', 10), 0);
  const tier = params.get('tier') as Tier | null;

  try {
    const coins = await getTopCoins({
      limit,
      offset,
      tier: tier ?? undefined,
    });

    return NextResponse.json(
      {
        data: coins,
        meta: {
          limit,
          offset,
          count: coins.length,
          attribution: 'Data: CoinGecko, DeFiLlama, CryptoRank · Tier by Cointier AI',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (e) {
    console.error('[/api/coins] error', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'fetch failed' }, { status: 500 });
  }
}
