/**
 * LunarCRUSH ingestion library — social signals → coins.lc_*.
 * Requires LUNARCRUSH_API_KEY; returns a "skipped" summary when missing
 * so the orchestrator can carry on without failing the whole batch.
 */
import { getCoins } from '@/lib/api/lunarcrush';
import { createServiceSupabase } from '@/lib/db/supabase';
import { resolveBySymbol } from '@/lib/db/coin-resolver';
import type { IngestSummary } from '@/lib/ingest/defillama';

interface LcRow {
  id: number;
  symbol: string;
  galaxy_score: number;
  alt_rank: number;
  social_volume_24h: number;
  social_contributors: number;
  sentiment: number;
  posts_active: number;
  interactions_24h: number;
}

export async function ingestLunarCrush(): Promise<IngestSummary> {
  const t0 = Date.now();
  if (!process.env.LUNARCRUSH_API_KEY) {
    return { source: 'lunarcrush', ok: true, ms: 0, stats: { skipped: 1 }, errors: ['LUNARCRUSH_API_KEY not set'] };
  }

  const supabase = createServiceSupabase();
  const response = await getCoins().catch(() => null);
  const rows = (response as { data?: LcRow[] } | null)?.data;
  if (!Array.isArray(rows)) {
    return { source: 'lunarcrush', ok: false, ms: Date.now() - t0, stats: {}, errors: ['bad response shape'] };
  }

  let matched = 0;
  let updated = 0;
  for (const lc of rows) {
    const coin = await resolveBySymbol(supabase, lc.symbol);
    if (!coin) continue;
    matched++;
    const { error } = await supabase
      .from('coins')
      .update({
        lunarcrush_id: lc.id,
        lc_galaxy_score: lc.galaxy_score,
        lc_alt_rank: lc.alt_rank,
        lc_social_volume_24h: lc.social_volume_24h,
        lc_social_contributors: lc.social_contributors,
        lc_sentiment: lc.sentiment,
        lc_posts_active: lc.posts_active,
        lc_interactions_24h: lc.interactions_24h,
        last_ingest_lunarcrush: new Date().toISOString(),
      })
      .eq('id', coin.id);
    if (!error) updated++;
  }

  return { source: 'lunarcrush', ok: true, ms: Date.now() - t0, stats: { rows: rows.length, matched, updated } };
}
