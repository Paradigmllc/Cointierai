/**
 * scripts/ingest-coingecko-ohlc.ts
 *
 * Top 500 coins の OHLC (Open/High/Low/Close) 価格履歴を ingestion
 * → coin_metrics_daily テーブルに 365 日分蓄積
 * → チャート表示 (TradingView 補完) / Tier 評価用ヒストリカル分析の base
 *
 * CoinGecko Demo: /coins/{id}/ohlc?days=365
 * Rate limit: 30/min → 2 秒/call
 */

import 'dotenv/config';
import { createServiceSupabase } from '../src/lib/db/supabase';

const TARGET_LIMIT = parseInt(process.env.OHLC_LIMIT ?? '500', 10);
const SLEEP_MS = parseInt(process.env.OHLC_SLEEP_MS ?? '2500', 10);
const DAYS = parseInt(process.env.OHLC_DAYS ?? '365', 10);

async function fetchOhlc(coinId: string): Promise<Array<[number, number, number, number, number]>> {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${DAYS}`;
  const apiKey = process.env.COINGECKO_API_KEY;
  const res = await fetch(url, {
    headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : {},
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`CoinGecko OHLC ${res.status}`);
  return (await res.json()) as Array<[number, number, number, number, number]>;
}

async function main() {
  const supabase = createServiceSupabase();
  const { data: coins } = await supabase
    .from('coins')
    .select('id')
    .eq('is_active', true)
    .order('market_cap_usd', { ascending: false, nullsFirst: false })
    .limit(TARGET_LIMIT);

  let total = 0;
  let failed = 0;
  for (const c of coins ?? []) {
    try {
      const ohlc = await fetchOhlc(c.id);
      const rows = ohlc.map(([ts, , , , close]) => ({
        coin_id: c.id,
        date: new Date(ts).toISOString().slice(0, 10),
        price_usd: close,
      }));
      // 365 行を upsert
      if (rows.length) {
        const { error } = await supabase.from('coin_metrics_daily').upsert(rows, { onConflict: 'coin_id,date' });
        if (error) console.warn('[ohlc] upsert', c.id, error.message);
      }
      total += rows.length;
    } catch (e) {
      failed++;
      console.warn('[ohlc] failed', c.id, e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }
  console.log(`[ohlc] done · ${total} rows · ${failed} failed`);
}

main().catch((err) => {
  console.error('[ohlc] fatal', err);
  process.exit(1);
});
