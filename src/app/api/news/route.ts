/**
 * CryptoPanic news proxy.
 *   /api/news                         → global hot news
 *   /api/news?currencies=BTC          → coin-specific
 *   /api/news?filter=bullish          → filter by sentiment
 */
import { NextResponse } from 'next/server';
import { getNews } from '@/lib/api/cryptopanic';

export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const currencies = url.searchParams.get('currencies') ?? undefined;
  const filter = (url.searchParams.get('filter') ?? undefined) as
    | 'rising' | 'hot' | 'bullish' | 'bearish' | 'important' | 'saved' | 'lol' | undefined;
  const items = await getNews({ currencies, filter });
  return NextResponse.json({ items });
}
