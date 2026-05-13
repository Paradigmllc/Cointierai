import { NextResponse } from 'next/server';
import { getMarketGlobal } from '@/lib/db/queries';

export async function GET() {
  try {
    const data = await getMarketGlobal();
    if (!data) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
    return NextResponse.json(
      { data, attribution: 'Data: CoinGecko' },
      { headers: { 'Cache-Control': 'public, s-maxage=300' } },
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'fetch failed' }, { status: 500 });
  }
}
