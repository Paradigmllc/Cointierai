/**
 * scripts/ingest-defillama.ts
 *
 * DeFiLlama (完全無料) を Supabase coins テーブルへ集約書込み:
 *   - protocol TVL → coins.defillama_tvl_usd / defillama_slug / defillama_category
 *   - raises      → funding_rounds + vc_funds
 *   - hacks       → hacks テーブル + coins.hack_count / hack_total_lost_usd 集計
 *
 * 設計: 全 protocol を symbol で coins に resolve し、TVL を materialize
 */

import 'dotenv/config';
import { getProtocols, getRaises, getHacks } from '../src/lib/api/defillama';
import { createServiceSupabase } from '../src/lib/db/supabase';
import { bulkResolveSymbols, resolveCoin } from '../src/lib/db/coin-resolver';

async function ingestProtocolTvl() {
  const supabase = createServiceSupabase();
  const protocols = await getProtocols();
  console.log(`[ingest:defillama] protocols: ${protocols.length}`);

  // 全 symbol を一括解決
  const symbolToId = await bulkResolveSymbols(
    supabase,
    protocols.map((p) => p.symbol ?? '').filter(Boolean),
  );

  let matched = 0;
  let updated = 0;
  for (const p of protocols) {
    if (!p.symbol) continue;
    const coinId = symbolToId.get(p.symbol.toLowerCase());
    if (!coinId) continue;
    matched++;

    const { error } = await supabase
      .from('coins')
      .update({
        defillama_slug: p.id,
        defillama_tvl_usd: p.tvl,
        defillama_tvl_change_1d: p.change_1d,
        defillama_tvl_change_7d: p.change_7d,
        defillama_category: p.category,
        defillama_chains: p.chains,
        last_ingest_defillama: new Date().toISOString(),
      })
      .eq('id', coinId);
    if (!error) updated++;
  }
  console.log(`[ingest:defillama] protocol matched: ${matched} · TVL updated: ${updated}`);
}

async function ingestRaises() {
  const supabase = createServiceSupabase();
  const { raises } = await getRaises();
  console.log(`[ingest:defillama] raises: ${raises.length}`);

  // VC fund upsert
  const investorMap = new Map<string, { name: string; deals: number; totalUsd: number }>();
  for (const r of raises) {
    for (const investor of [...r.leadInvestors, ...r.otherInvestors]) {
      if (!investor) continue;
      const e = investorMap.get(investor) ?? { name: investor, deals: 0, totalUsd: 0 };
      e.deals += 1;
      e.totalUsd += r.amount ?? 0;
      investorMap.set(investor, e);
    }
  }
  const vcFundRows = [...investorMap.values()].map((v) => ({
    slug: v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: v.name,
    portfolio_count: v.deals,
    total_invested_usd: v.totalUsd > 0 ? v.totalUsd : null,
    source: 'defillama',
  }));
  await supabase.from('vc_funds').upsert(vcFundRows, { onConflict: 'slug' });
  console.log(`[ingest:defillama] vc_funds upserted: ${vcFundRows.length}`);

  // funding_rounds + coins.funding_* aggregate
  const coinAggregates = new Map<string, { total: number; count: number; latestDate: string | null; latestRound: string | null; latestValuation: number | null }>();
  for (const r of raises) {
    const coin = await resolveCoin(supabase, { name: r.name });
    if (!coin) continue;

    // Insert funding round
    const dateStr = new Date(r.date * 1000).toISOString().slice(0, 10);
    await supabase.from('funding_rounds').insert({
      coin_id: coin.id,
      round_type: r.round,
      amount_usd: r.amount,
      valuation_usd: r.valuation,
      date: dateStr,
      source: 'defillama',
      source_url: r.source,
    });

    // Aggregate
    const agg = coinAggregates.get(coin.id) ?? { total: 0, count: 0, latestDate: null, latestRound: null, latestValuation: null };
    agg.total += r.amount ?? 0;
    agg.count += 1;
    if (!agg.latestDate || dateStr > agg.latestDate) {
      agg.latestDate = dateStr;
      agg.latestRound = r.round;
      agg.latestValuation = r.valuation;
    }
    coinAggregates.set(coin.id, agg);
  }

  // Write back aggregates to coins
  for (const [coinId, agg] of coinAggregates) {
    await supabase
      .from('coins')
      .update({
        funding_total_usd: agg.total,
        funding_round_count: agg.count,
        funding_latest_round: agg.latestRound,
        funding_latest_date: agg.latestDate,
        funding_latest_valuation_usd: agg.latestValuation,
      })
      .eq('id', coinId);
  }
  console.log(`[ingest:defillama] funding aggregates written for ${coinAggregates.size} coins`);
}

async function ingestHacks() {
  const supabase = createServiceSupabase();
  const hacks = await getHacks();
  console.log(`[ingest:defillama] hacks: ${hacks.length}`);

  const coinHackCounts = new Map<string, { count: number; totalLost: number }>();
  for (const h of hacks.slice(0, 2000)) {
    const coin = await resolveCoin(supabase, { name: h.name });

    if (coin) {
      const agg = coinHackCounts.get(coin.id) ?? { count: 0, totalLost: 0 };
      agg.count += 1;
      agg.totalLost += h.amount ?? 0;
      coinHackCounts.set(coin.id, agg);
    }

    await supabase.from('hacks').insert({
      coin_id: coin?.id ?? null,
      protocol_name: h.name,
      date: new Date(h.date * 1000).toISOString().slice(0, 10),
      amount_lost_usd: h.amount,
      root_cause: h.classification,
      source_urls: h.source ? [h.source] : [],
    });
  }

  for (const [coinId, agg] of coinHackCounts) {
    await supabase
      .from('coins')
      .update({ hack_count: agg.count, hack_total_lost_usd: agg.totalLost })
      .eq('id', coinId);
  }
  console.log(`[ingest:defillama] hack aggregates written for ${coinHackCounts.size} coins`);
}

async function main() {
  const t0 = Date.now();
  console.log('[ingest:defillama] start');
  await ingestProtocolTvl();
  await ingestRaises();
  await ingestHacks();
  console.log(`[ingest:defillama] done · ${Math.round((Date.now() - t0) / 1000)}s`);
}

main().catch((err) => {
  console.error('[ingest:defillama] fatal', err);
  process.exit(1);
});
