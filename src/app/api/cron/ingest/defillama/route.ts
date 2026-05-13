import { NextRequest, NextResponse } from 'next/server';
import { ingestAllDeFiLlama, ingestProtocolTvl, ingestRaises, ingestHacks } from '@/lib/ingest/defillama';

/**
 * POST /api/cron/ingest/defillama?part=tvl|raises|hacks|all  (default: all)
 *
 * Auth: header `X-Cron-Secret` must match `CRON_SECRET` env. The same secret is
 * baked into the Dockerfile build-arg pipeline and surfaced as a Coolify env
 * var, so Coolify scheduled-tasks can hit this route over HTTP.
 *
 * Returns a per-pipeline IngestSummary array so the caller can log timings and
 * record counts. Failures inside one pipeline don't abort the others —
 * orchestration is fail-soft.
 *
 * Manual trigger:
 *   curl -X POST -H "X-Cron-Secret: $CRON_SECRET" \
 *        https://cointier.ai/api/cron/ingest/defillama?part=all
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 800;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const part = req.nextUrl.searchParams.get('part') ?? 'all';
  try {
    if (part === 'tvl') return NextResponse.json([await ingestProtocolTvl()]);
    if (part === 'raises') return NextResponse.json([await ingestRaises()]);
    if (part === 'hacks') return NextResponse.json([await ingestHacks()]);
    return NextResponse.json(await ingestAllDeFiLlama());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'ingestion failed' },
      { status: 500 },
    );
  }
}

// GET is allowed for browser-test convenience (still gated by the secret).
export async function GET(req: NextRequest) {
  return POST(req);
}
