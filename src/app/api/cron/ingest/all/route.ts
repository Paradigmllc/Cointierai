import { NextRequest, NextResponse } from 'next/server';
import { ingestAllDeFiLlama } from '@/lib/ingest/defillama';
import { ingestHyperliquid } from '@/lib/ingest/hyperliquid';
import { ingestDexScreener } from '@/lib/ingest/dexscreener';
import type { IngestSummary } from '@/lib/ingest/defillama';

/**
 * POST /api/cron/ingest/all
 *
 * Fan-out orchestrator that runs every free-tier ingestion in parallel and
 * returns a flat array of per-source IngestSummary results. Each source is
 * wrapped in its own try/catch so a single failure can't take the rest down.
 *
 * Designed to be Coolify-cron-friendly (max 800s timeout) and idempotent —
 * safe to re-run as often as needed.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 800;

async function safe(label: string, fn: () => Promise<IngestSummary | IngestSummary[]>): Promise<IngestSummary[]> {
  try {
    const r = await fn();
    return Array.isArray(r) ? r : [r];
  } catch (e) {
    return [
      {
        source: label,
        ok: false,
        ms: 0,
        stats: {},
        errors: [e instanceof Error ? e.message : 'unknown'],
      },
    ];
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const t0 = Date.now();
  const results = await Promise.all([
    safe('defillama:*', () => ingestAllDeFiLlama()),
    safe('hyperliquid', () => ingestHyperliquid()),
    safe('dexscreener', () => ingestDexScreener({ limit: 300 })),
  ]);
  const flat = results.flat();
  const totalMs = Date.now() - t0;
  const allOk = flat.every((r) => r.ok);
  return NextResponse.json({ ok: allOk, total_ms: totalMs, results: flat });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
