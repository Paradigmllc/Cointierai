/**
 * scripts/ingest-dexscreener.ts
 *
 * DEXScreener — DEX pair 情報を coins.dex_* に集約 materialize
 *   - dex_total_liquidity_usd (全 pair 合計)
 *   - dex_pair_count
 *   - dex_top_pair_* (最高流動性 pair)
 *
 * 完全無料・300 req/分
 * 上位 500 coins の contract_address から pair 取得
 */

import 'dotenv/config';
import { getPairsByToken } from '../src/lib/api/dexscreener';
import { createServiceSupabase } from '../src/lib/db/supabase';

async function main() {
  const supabase = createServiceSupabase();
  const { data: coins } = await supabase
    .from('coins')
    .select('id, contract_address, chain_id')
    .not('contract_address', 'is', null)
    .order('market_cap_usd', { ascending: false, nullsFirst: false })
    .limit(500);

  let matched = 0;
  let updated = 0;
  for (const c of coins ?? []) {
    if (!c.contract_address) continue;
    try {
      const { pairs } = await getPairsByToken(c.chain_id ?? 'ethereum', c.contract_address);
      if (!pairs?.length) continue;
      matched++;

      const totalLiquidity = pairs.reduce((s, p) => s + (p.liquidity?.usd ?? 0), 0);
      const top = pairs[0]; // pairs は API から流動性順に sorted

      // coin_exchanges にも書き込み (M1 と互換)
      for (const p of pairs.slice(0, 5)) {
        await supabase.from('coin_exchanges').upsert({
          coin_id: c.id,
          exchange_id: p.dexId,
          trading_pair: `${p.baseToken.symbol}/${p.quoteToken.symbol}`,
          volume_24h_usd: p.volume.h24,
        });
      }

      // coins テーブル aggregate update
      const { error } = await supabase
        .from('coins')
        .update({
          dex_total_liquidity_usd: totalLiquidity,
          dex_pair_count: pairs.length,
          dex_top_pair_address: top.pairAddress,
          dex_top_pair_chain: top.chainId,
          dex_top_pair_volume_24h: top.volume?.h24 ?? null,
          last_ingest_dexscreener: new Date().toISOString(),
        })
        .eq('id', c.id);
      if (!error) updated++;
    } catch (e) {
      console.warn('[ingest:dex] failed', c.id, e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`[ingest:dex] matched ${matched} · coins updated ${updated}`);
}

main().catch((err) => {
  console.error('[ingest:dex] fatal', err);
  process.exit(1);
});
