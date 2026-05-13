/**
 * scripts/ingest-coingecko.ts
 *
 * CoinGecko Demo API から coins テーブルへ初回全量投入。
 *
 * 実行:
 *   pnpm ingest:coingecko
 *
 * 動作:
 *   1. /coins/markets を 1 ページ 250 件で 68 回叩く (17K coins)
 *   2. ~2 sec/req のレート制限間隔
 *   3. Supabase coins テーブルへ upsert
 *
 * 月間 call 消費:
 *   - 初回: 68 calls (1 day)
 *   - 日次差分: 4 calls/day × 30 = 120 calls/month → 月 10K の 1.2% で余裕
 */

import 'dotenv/config';
import { iterateAllMarkets } from '../src/lib/api/coingecko';
import { createServiceSupabase } from '../src/lib/db/supabase';
import type { Coin, Tier } from '../src/types/database';

function tierFromRank(rank: number | null): Tier | null {
  if (rank === null) return null;
  if (rank <= 20) return 'S';
  if (rank <= 100) return 'A';
  if (rank <= 500) return 'B';
  if (rank <= 2000) return 'C';
  if (rank <= 5000) return 'D';
  return 'F';
}

async function main() {
  const supabase = createServiceSupabase();
  let totalIngested = 0;
  let totalErrors = 0;
  const startedAt = Date.now();

  console.log('[ingest:coingecko] start');

  for await (const batch of iterateAllMarkets(250)) {
    const rows: Partial<Coin>[] = batch.map((m) => ({
      id: m.id,
      symbol: m.symbol,
      name: m.name,
      image_url: m.image,
      rank: m.market_cap_rank ?? null,
      price_usd: m.current_price,
      market_cap_usd: m.market_cap,
      fdv_usd: m.fully_diluted_valuation,
      volume_24h_usd: m.total_volume,
      circulating_supply: m.circulating_supply,
      total_supply: m.total_supply,
      max_supply: m.max_supply,
      ath_usd: m.ath,
      ath_date: m.ath_date,
      atl_usd: m.atl,
      atl_date: m.atl_date,
      change_1h: m.price_change_percentage_1h_in_currency ?? null,
      change_24h: m.price_change_percentage_24h,
      change_7d: m.price_change_percentage_7d_in_currency ?? null,
      change_30d: m.price_change_percentage_30d_in_currency ?? null,
      change_1y: m.price_change_percentage_1y_in_currency ?? null,
      tier: tierFromRank(m.market_cap_rank ?? null),
      is_active: true,
      source: 'coingecko',
      primary_source_id: m.id,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('coins').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('[ingest:coingecko] upsert error:', error);
      totalErrors += batch.length;
    } else {
      totalIngested += batch.length;
      console.log(`[ingest:coingecko] upserted ${rows.length} coins · running total: ${totalIngested}`);
    }
  }

  const durSec = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[ingest:coingecko] done · ${totalIngested} ingested · ${totalErrors} errors · ${durSec}s`);
}

main().catch((err) => {
  console.error('[ingest:coingecko] fatal', err);
  process.exit(1);
});
