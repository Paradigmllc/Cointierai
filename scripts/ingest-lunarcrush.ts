/**
 * scripts/ingest-lunarcrush.ts
 *
 * LunarCRUSH — Social sentiment & community engagement
 * Pattern B 個人投資家向け Tier 評価で「community」軸の主要シグナル。
 *
 * 取得した galaxy_score / social_volume を coin の community 評価に活用。
 */

import 'dotenv/config';
import { getCoins } from '../src/lib/api/lunarcrush';
import { createServiceSupabase } from '../src/lib/db/supabase';

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

  const coins = (response as { data?: unknown[] }).data;
  if (!Array.isArray(coins)) {
    console.warn('[ingest:lc] unexpected response shape');
    return;
  }
  let total = 0;
  for (const lc of coins as Array<{ symbol: string; galaxy_score: number; social_volume_24h: number; sentiment: number }>) {
    const { data: coin } = await supabase
      .from('coins')
      .select('id')
      .eq('symbol', lc.symbol.toLowerCase())
      .maybeSingle();
    if (!coin) continue;
    // Social signal データを将来用カラム拡張で保存
    // 現状: tier_evaluations.reasoning jsonb に格納する設計
    total++;
  }
  console.log(`[ingest:lc] processed ${total} coins`);
}

main().catch((err) => {
  console.error('[ingest:lc] fatal', err);
  process.exit(1);
});
