/**
 * scripts/ingest-tokenomist.ts
 *
 * Tokenomist.ai (要交渉) から正式アンロックスケジュールを取得。
 * 価格影響履歴データが他 API にない独自性 — AI リスクスコアの核心。
 *
 * 未契約時は DeFiLlama Unlocks で代替。
 */

import 'dotenv/config';
import { getUpcomingUnlocks } from '../src/lib/api/tokenomist';
import { getUnlocks as getLlamaUnlocks } from '../src/lib/api/defillama';
import { createServiceSupabase } from '../src/lib/db/supabase';

async function main() {
  const supabase = createServiceSupabase();

  // 1. Tokenomist API がある場合
  if (process.env.TOKENOMIST_API_KEY) {
    try {
      const tmUnlocks = await getUpcomingUnlocks(90);
      console.log(`[ingest:tokenomist] tokenomist unlocks: ${tmUnlocks.length}`);
      for (const u of tmUnlocks) {
        // symbol で coin_id 解決
        const { data: coin } = await supabase
          .from('coins')
          .select('id')
          .eq('symbol', u.token_symbol.toLowerCase())
          .maybeSingle();
        if (!coin) continue;
        await supabase.from('token_unlocks').insert({
          coin_id: coin.id,
          unlock_date: u.unlock_date,
          amount: u.amount,
          percentage_of_supply: u.percentage_of_supply,
          category: u.category,
          historical_impact_pct: u.historical_impact_pct,
          source: 'tokenomist',
        });
        // last_ingest_tokenomist を更新
        await supabase
          .from('coins')
          .update({ last_ingest_tokenomist: new Date().toISOString() })
          .eq('id', coin.id);
      }
    } catch (e) {
      console.warn('[ingest:tokenomist] Tokenomist fetch failed, falling back', e);
    }
  }

  // 2. DeFiLlama Unlocks fallback (常に併用 = データ密度向上)
  try {
    const llamaData = (await getLlamaUnlocks()) as Array<{
      symbol: string;
      gecko_id: string | null;
      events?: Array<{ timestamp: number; noOfTokens: number[]; category: string; description: string }>;
    }>;
    let count = 0;
    for (const entry of llamaData ?? []) {
      if (!entry.gecko_id || !entry.events) continue;
      for (const ev of entry.events) {
        if (ev.timestamp * 1000 < Date.now()) continue;
        const amount = ev.noOfTokens.reduce((s, n) => s + (n ?? 0), 0);
        const { error } = await supabase.from('token_unlocks').insert({
          coin_id: entry.gecko_id,
          unlock_date: new Date(ev.timestamp * 1000).toISOString(),
          amount,
          category: ev.category,
          source: 'defillama',
        });
        if (!error || !error.message.includes('duplicate')) count++;
      }
    }
    console.log(`[ingest:tokenomist] defillama unlocks ingested: ${count}`);
  } catch (e) {
    console.error('[ingest:tokenomist] defillama failed', e);
  }
}

main().catch((err) => {
  console.error('[ingest:tokenomist] fatal', err);
  process.exit(1);
});
