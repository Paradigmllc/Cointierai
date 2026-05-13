import { NextRequest, NextResponse } from 'next/server';
import { getCoin } from '@/lib/db/queries';

export async function GET(req: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const locale = req.nextUrl.searchParams.get('locale') ?? 'ja';
  try {
    const result = await getCoin(symbol);
    if (!result) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    return NextResponse.json(
      {
        data: result.coin,
        summary: result.summary,
        locale,
        attribution: 'Data: CoinGecko + ecosystem · Tier by Cointier AI',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (e) {
    console.error('[/api/coin] error', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'fetch failed' }, { status: 500 });
  }
}
