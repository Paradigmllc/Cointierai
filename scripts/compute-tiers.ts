/**
 * scripts/compute-tiers.ts
 *
 * Tier 評価パイプライン — coins テーブルの集約済 signals を使って 6 軸スコア算出
 *
 * 改訂版: ingest-{all} で各 source から coins.{defillama_tvl_usd, lc_galaxy_score,
 *   tt_pe_ratio, hl_listed, dex_total_liquidity_usd, funding_total_usd, github_stars,
 *   twitter_followers, hack_count, has_fsa_warning_exchange, ...} が
 *   materialized されている前提。これらを直接読んで computeTier に渡す。
 */

import 'dotenv/config';
import { createServiceSupabase } from '../src/lib/db/supabase';
import { computeTier, type TierInputs } from '../src/lib/tier-evaluation/score';
import type { Coin } from '../src/types/database';

const BATCH_SIZE = 100;

async function processCoin(supabase: ReturnType<typeof createServiceSupabase>, c: Coin) {
  const inputs: TierInputs = {
    coin: {
      symbol: c.symbol,
      name: c.name,
      marketCap: c.market_cap_usd,
      volume24h: c.volume_24h_usd,
      rank: c.rank,
      fdv: c.fdv_usd,
      circulatingSupply: c.circulating_supply,
      maxSupply: c.max_supply,
      age_days: Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000),
    },
    funding: {
      totalRaisedUsd: c.funding_total_usd ?? 0,
      topInvestors: [],
      // funding_round_count > 3 + valuation > $100M = top tier VC backing 推定
      isLeadByTopVc: (c.funding_round_count ?? 0) >= 3 && (c.funding_latest_valuation_usd ?? 0) >= 100_000_000,
    },
    hacks: {
      count: c.hack_count ?? 0,
      totalLostUsd: c.hack_total_lost_usd ?? 0,
    },
    exchanges: {
      count: c.exchange_listing_count ?? 0,
      hasFsaWarning: c.has_fsa_warning_exchange ?? false,
    },
    dex: {
      pairCount: c.dex_pair_count ?? 0,
      totalLiquidityUsd: c.dex_total_liquidity_usd ?? 0,
    },
    community: {
      githubStars: c.github_stars ?? undefined,
      twitterFollowers: c.twitter_followers ?? undefined,
    },
  };

  // LunarCRUSH galaxy_score を community 軸の補強として inputs に注入
  // (score.ts は galaxy_score を直接知らないので signals_metadata に格納)
  const galaxyScore = c.lc_galaxy_score;
  const sentiment = c.lc_sentiment;

  const result = computeTier(inputs);

  // LunarCRUSH の社会的シグナルで community score を補正 (galaxy >= 70 で +10pt まで)
  if (galaxyScore !== null && galaxyScore !== undefined && galaxyScore > 50) {
    const boost = Math.min(15, (galaxyScore - 50) * 0.4);
    result.factors.community = Math.min(100, result.factors.community + boost);
  }
  // Hyperliquid listed = 流動性 + future の補強
  if (c.hl_listed) {
    result.factors.liquidity = Math.min(100, result.factors.liquidity + 5);
    result.factors.future = Math.min(100, result.factors.future + 5);
  }
  // Token Terminal の正の収益 = future + technology の補強
  if (c.tt_revenue_annualized_usd && c.tt_revenue_annualized_usd > 1_000_000) {
    result.factors.technology = Math.min(100, result.factors.technology + 8);
    result.factors.future = Math.min(100, result.factors.future + 5);
  }
  // DeFiLlama TVL も future の補強
  if (c.defillama_tvl_usd && c.defillama_tvl_usd > 100_000_000) {
    result.factors.future = Math.min(100, result.factors.future + 5);
  }

  // 補正後の totalScore 再計算
  const FW = { liquidity: 0.10, team: 0.15, technology: 0.15, community: 0.25, regulatory: 0.10, future: 0.25 };
  const totalScore =
    result.factors.liquidity * FW.liquidity +
    result.factors.team * FW.team +
    result.factors.technology * FW.technology +
    result.factors.community * FW.community +
    result.factors.regulatory * FW.regulatory +
    result.factors.future * FW.future;

  let tier: typeof result.tier = 'F';
  if (totalScore >= 80) tier = 'S';
  else if (totalScore >= 65) tier = 'A';
  else if (totalScore >= 50) tier = 'B';
  else if (totalScore >= 35) tier = 'C';
  else if (totalScore >= 20) tier = 'D';

  await supabase.from('tier_evaluations').insert({
    coin_id: c.id,
    tier,
    total_score: Math.round(totalScore * 10) / 10,
    liquidity_score: result.factors.liquidity,
    team_score: result.factors.team,
    technology_score: result.factors.technology,
    community_score: result.factors.community,
    regulatory_score: result.factors.regulatory,
    future_score: result.factors.future,
    reasoning: {
      rule_based: result.reasoning,
      pattern: 'B-individual-investor',
      lc_galaxy_score: galaxyScore,
      lc_sentiment: sentiment,
      hl_listed: c.hl_listed,
      defillama_tvl_usd: c.defillama_tvl_usd,
      tt_revenue_annualized_usd: c.tt_revenue_annualized_usd,
    },
    llm_model: 'rule-based-v2-aggregated',
  });

  await supabase
    .from('coins')
    .update({
      tier,
      tier_score: Math.round(totalScore * 10) / 10,
      tier_updated_at: new Date().toISOString(),
    })
    .eq('id', c.id);

  return tier;
}

async function main() {
  const supabase = createServiceSupabase();
  let offset = 0;
  const tierCounts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  const startedAt = Date.now();

  while (true) {
    const { data: coins, error } = await supabase
      .from('coins')
      .select('*')
      .eq('is_active', true)
      .order('rank', { ascending: true, nullsFirst: false })
      .range(offset, offset + BATCH_SIZE - 1);
    if (error) {
      console.error('[compute-tiers] fetch error:', error);
      break;
    }
    if (!coins?.length) break;

    for (const c of coins as Coin[]) {
      try {
        const tier = await processCoin(supabase, c);
        tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
      } catch (e) {
        console.warn('[compute-tiers] coin failed', c.symbol, e instanceof Error ? e.message : e);
      }
    }
    offset += BATCH_SIZE;
    console.log(`[compute-tiers] processed ${offset} · ${Object.entries(tierCounts).map(([t, n]) => `${t}=${n}`).join(' ')}`);
  }

  const durSec = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[compute-tiers] done · ${durSec}s · final distribution:`, tierCounts);
}

main().catch((err) => {
  console.error('[compute-tiers] fatal', err);
  process.exit(1);
});
