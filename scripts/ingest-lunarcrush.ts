/**
 * scripts/ingest-lunarcrush.ts
 *
 * LunarCRUSH — Social signals を coins.lc_* に materialize
 * Pattern B 個人投資家向け Tier 評価の community 軸 (weight 0.25) のコアシグナル。
 */

import 'dotenv/config';
import { getCoins } from '../src/lib/api/lunarcrush';
import { createServiceSupabase } from '../src/lib/db/supabase';
import { resolveBySymbol } from '../src/lib/db/coin-resolver';

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

async function main() {
  if (!process.env.LUNARCRUSH_API_KEY) {
    console.warn('[ingest:lc] LUNARCRUSH_API_KEY not set, skipping');
    return;
  }
  const supabase = createServiceSupabase();
  const response = await getCoins().catch((e) => {
    console.error('[ingest:lc] fetch fail', e);
    return null;
  });
  if (!response) return;

  const rows = (response as { data?: LcRow[] }).data;
  if (!Array.isArray(rows)) {
    console.warn('[ingest:lc] unexpected response shape');
    return;
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
  console.log(`[ingest:lc] matched ${matched} · updated ${updated}`);
}

main().catch((err) => {
  console.error('[ingest:lc] fatal', err);
  process.exit(1);
});
