import { NextRequest, NextResponse } from 'next/server';
import { ingestDexScreener } from '@/lib/ingest/dexscreener';

/**
 * POST /api/cron/ingest/dexscreener?limit=500
 *
 * Walks the top-N coins (by market cap) that have a contract_address and
 * fetches their pairs from DEXScreener. Throttled at 250ms/coin to stay
 * inside the 300 req/min free tier ceiling.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 800;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '500');
  try {
    return NextResponse.json([await ingestDexScreener({ limit })]);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'ingestion failed' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
