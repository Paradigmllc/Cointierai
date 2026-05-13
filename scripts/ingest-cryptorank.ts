/**
 * scripts/ingest-cryptorank.ts
 *
 * CryptoRank Basic ($19/月) または Sandbox からの取得:
 *   1. 全銘柄 metadata (cryptorank_id を coins テーブルに紐付け)
 *   2. funding_rounds (VC 投資履歴)
 *   3. token_sales → ido_events
 *
 * 月クレジット消費 (Basic 100K credits):
 *   - 銘柄一覧: 370 cr (initial full sweep)
 *   - funding rounds: 1000 coins × 2 cr = 2000 cr
 *   - token sales: 100 cr
 *   合計 ~2,500 cr/月 → 余裕で枠内
 *
 * Sandbox の場合は商用利用不可・開発用途のみ。
 *
 * 実行: pnpm tsx scripts/ingest-cryptorank.ts
 */

import 'dotenv/config';
import { iterateAllCurrencies, getFundingRounds, getTokenSales } from '../src/lib/api/cryptorank';
import { createServiceSupabase } from '../src/lib/db/supabase';

async function ingestCurrencies() {
  const supabase = createServiceSupabase();
  let total = 0;
  for await (const batch of iterateAllCurrencies(100)) {
    // 既存の coins テーブルに cryptorank_id を埋める (symbol で照合)
    for (const c of batch) {
      const { error } = await supabase
        .from('coins')
        .update({
          cryptorank_id: c.key,
          updated_at: new Date().toISOString(),
          last_ingest_cryptorank: new Date().toISOString(),
        })
        .eq('symbol', c.symbol.toLowerCase());
      if (error) console.warn('[ingest:cryptorank] update fail', c.symbol, error.message);
    }
    total += batch.length;
    console.log(`[ingest:cryptorank] currencies processed: ${total}`);
  }
}

async function ingestFundingRounds() {
  const supabase = createServiceSupabase();
  // Top 500 coins の funding rounds を取得
  const { data: coins } = await supabase
    .from('coins')
    .select('id, cryptorank_id')
    .not('cryptorank_id', 'is', null)
    .order('market_cap_usd', { ascending: false, nullsFirst: false })
    .limit(500);
  if (!coins?.length) {
    console.warn('[ingest:cryptorank] no coins with cryptorank_id');
    return;
  }
  for (const c of coins) {
    try {
      const { data: rounds } = await getFundingRounds(c.cryptorank_id!);
      for (const r of rounds) {
        const { error } = await supabase.from('funding_rounds').insert({
          coin_id: c.id,
          round_type: r.type,
          amount_usd: r.amount,
          valuation_usd: r.valuation,
          date: r.date.slice(0, 10),
          source: 'cryptorank',
          source_url: r.sourceUrl,
        });
        if (error && !error.message.includes('duplicate')) {
          console.warn('[ingest:cryptorank] round insert fail', error.message);
        }
      }
    } catch (e) {
      console.warn('[ingest:cryptorank] rounds fail', c.id, e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, 700));
  }
}

async function ingestTokenSales() {
  const supabase = createServiceSupabase();
  try {
    const { data: sales } = await getTokenSales();
    for (const s of sales) {
      const { error } = await supabase.from('ido_events').insert({
        coin_id: s.currencyKey,
        exchange: s.exchanges?.[0] ?? null,
        start_date: s.startDate,
        end_date: s.endDate,
        initial_price: s.tokenPrice,
        raise_amount_usd: s.totalRaise,
        source: 'cryptorank',
      });
      if (error && !error.message.includes('duplicate')) {
        console.warn('[ingest:cryptorank] token sale fail', error.message);
      }
    }
  } catch (e) {
    console.warn('[ingest:cryptorank] token sales fetch failed', e);
  }
}

async function main() {
  const startedAt = Date.now();
  console.log('[ingest:cryptorank] start');
  await ingestCurrencies();
  await ingestFundingRounds();
  await ingestTokenSales();
  console.log(`[ingest:cryptorank] done · ${Math.round((Date.now() - startedAt) / 1000)}s`);
}

main().catch((err) => {
  console.error('[ingest:cryptorank] fatal', err);
  process.exit(1);
});
