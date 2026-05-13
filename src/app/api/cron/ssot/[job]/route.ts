/**
 * /api/cron/ssot/[job] — SSOT ingest trigger endpoint.
 *
 *   /api/cron/ssot/all              → run all ingest jobs sequentially
 *   /api/cron/ssot/dex_pairs        → just one
 *   /api/cron/ssot/news_articles
 *   /api/cron/ssot/derivatives_snapshots
 *   /api/cron/ssot/holders          (top 100 coins only)
 *   /api/cron/ssot/developer        (top 100 coins only)
 *   /api/cron/ssot/messari          (top 200 coins onchain + team profile)
 *   /api/cron/ssot/yields_pools
 *   /api/cron/ssot/stablecoin_assets
 *   /api/cron/ssot/bridges
 *   /api/cron/ssot/exchanges_index
 *   /api/cron/ssot/dex_rankings
 *
 * Auth: CRON_SECRET query param OR Authorization: Bearer.
 * Returns: { jobs: IngestSummary[], totalMs }
 */
import { NextResponse } from 'next/server';
import {
  ingestDexPairs, ingestNews, ingestDerivatives, ingestHolders, ingestDeveloper,
  ingestMessari, ingestYields, ingestStablecoins, ingestBridges, ingestExchanges,
  ingestDexRankings, type IngestSummary,
} from '@/lib/ingest/ssot-jobs';
import { createServiceSupabase } from '@/lib/db/supabase';

export const maxDuration = 300; // 5 min budget
export const dynamic = 'force-dynamic';

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Strict by default — refuse rather than expose ingest publicly.
    // Set CRON_SECRET=allow-dev locally to opt in to an open endpoint.
    return process.env.NODE_ENV !== 'production' && process.env.NEXT_PHASE === 'phase-development-server';
  }
  const url = new URL(req.url);
  if (url.searchParams.get('secret') === secret) return true;
  const auth = req.headers.get('authorization') ?? '';
  if (auth === `Bearer ${secret}`) return true;
  return false;
}

async function topCoinIds(limit: number): Promise<string[]> {
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from('coins')
    .select('id')
    .order('rank', { ascending: true, nullsFirst: false })
    .limit(limit);
  return (data ?? []).map((c) => c.id as string);
}

export async function GET(req: Request, ctx: { params: Promise<{ job: string }> }) {
  if (!authorised(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { job } = await ctx.params;
  const t0 = Date.now();
  const out: IngestSummary[] = [];

  const runOne = async (name: string): Promise<void> => {
    switch (name) {
      case 'dex_pairs': out.push(await ingestDexPairs()); break;
      case 'news_articles': out.push(await ingestNews()); break;
      case 'derivatives_snapshots': out.push(await ingestDerivatives()); break;
      case 'holders': out.push(await ingestHolders(await topCoinIds(100))); break;
      case 'developer': out.push(await ingestDeveloper(await topCoinIds(100))); break;
      case 'messari': out.push(await ingestMessari(await topCoinIds(200))); break;
      case 'yields_pools': out.push(await ingestYields()); break;
      case 'stablecoin_assets': out.push(await ingestStablecoins()); break;
      case 'bridges': out.push(await ingestBridges()); break;
      case 'exchanges_index': out.push(await ingestExchanges()); break;
      case 'dex_rankings': out.push(await ingestDexRankings()); break;
      default:
        throw new Error(`unknown job: ${name}`);
    }
  };

  try {
    if (job === 'all') {
      // Lightweight jobs first, heavy ones last (so partial failures still leave the index populated)
      for (const name of ['stablecoin_assets', 'bridges', 'dex_rankings', 'exchanges_index', 'yields_pools', 'news_articles', 'derivatives_snapshots', 'dex_pairs', 'messari', 'developer', 'holders']) {
        try { await runOne(name); } catch (e) { out.push({ source: name, ok: false, ms: 0, rows: 0, errors: [e instanceof Error ? e.message : 'unknown'] }); }
      }
    } else {
      await runOne(job);
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed', jobs: out }, { status: 500 });
  }
  return NextResponse.json({ jobs: out, totalMs: Date.now() - t0 });
}
