/**
 * DEXScreener ingestion library — top 500 coins by market cap that have a
 * contract_address are queried for their DEX pairs; per-pair entries land in
 * `coin_exchanges` and the aggregate (total liquidity, pair count, top pair)
 * is materialized into `coins.dex_*`.
 */
import { getPairsByToken } from '@/lib/api/dexscreener';
import { createServiceSupabase } from '@/lib/db/supabase';
import type { IngestSummary } from '@/lib/ingest/defillama';

export async function ingestDexScreener(opts: { limit?: number } = {}): Promise<IngestSummary> {
  const t0 = Date.now();
  const limit = opts.limit ?? 500;
  const supabase = createServiceSupabase();
  const { data: coins } = await supabase
    .from('coins')
    .select('id, contract_address, chain_id')
    .not('contract_address', 'is', null)
    .order('market_cap_usd', { ascending: false, nullsFirst: false })
    .limit(limit);

  let matched = 0;
  let updated = 0;
  let pairsInserted = 0;
  const errors: string[] = [];
  for (const c of coins ?? []) {
    if (!c.contract_address) continue;
    try {
      const { pairs } = await getPairsByToken(c.chain_id ?? 'ethereum', c.contract_address);
      if (!pairs?.length) continue;
      matched++;

      const totalLiquidity = pairs.reduce((s, p) => s + (p.liquidity?.usd ?? 0), 0);
      const top = pairs[0];

      for (const p of pairs.slice(0, 5)) {
        const { error } = await supabase.from('coin_exchanges').upsert({
          coin_id: c.id,
          exchange_id: p.dexId,
          trading_pair: `${p.baseToken.symbol}/${p.quoteToken.symbol}`,
          volume_24h_usd: p.volume.h24,
        });
        if (!error) pairsInserted++;
      }

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
      errors.push(`${c.id}:${e instanceof Error ? e.message : 'failed'}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  return {
    source: 'dexscreener',
    ok: errors.length === 0,
    ms: Date.now() - t0,
    stats: { scanned: coins?.length ?? 0, matched, updated, pairs_inserted: pairsInserted },
    ...(errors.length > 0 ? { errors: errors.slice(0, 10) } : {}),
  };
}
