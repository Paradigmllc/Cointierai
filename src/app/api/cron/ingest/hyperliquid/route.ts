import { NextRequest, NextResponse } from 'next/server';
import { ingestHyperliquid } from '@/lib/ingest/hyperliquid';

/**
 * POST /api/cron/ingest/hyperliquid
 *
 * Pulls the entire perps universe (~150 assets) plus per-asset market context
 * and materializes hl_* columns onto matching coins. Idempotent.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 800;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json([await ingestHyperliquid()]);
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
