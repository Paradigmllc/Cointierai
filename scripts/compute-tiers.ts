/**
 * scripts/compute-tiers.ts
 *
 * Tier 評価パイプライン — DB の全 coin に対して 6 軸スコアリングを実行
 *
 * パターン B (個人投資家向け) — community + future 重視・草コインも S/A 可
 *
 * 流れ:
 *   1. coins テーブルから対象を取得
 *   2. 関連シグナル (funding_rounds / hacks / coin_exchanges / DEX) を集約
 *   3. computeTier() で 6 軸スコア算出
 *   4. tier_evaluations に詳細を insert
 *   5. coins.tier / coins.tier_score を update
 *
 * 実行: pnpm tsx scripts/compute-tiers.ts
 */

import 'dotenv/config';
import { createServiceSupabase } from '../src/lib/db/supabase';
import { computeTier, type TierInputs } from '../src/lib/tier-evaluation/score';

const BATCH_SIZE = 100;

interface RowCoin {
  id: string;
  symbol: string;
  name: string;
  market_cap_usd: number | null;
  volume_24h_usd: number | null;
  rank: number | null;
  fdv_usd: number | null;
  circulating_supply: number | null;
  max_supply: number | null;
  created_at: string;
}

async function processCoin(supabase: ReturnType<typeof createServiceSupabase>, c: RowCoin) {
  // 関連データ集約
  const [{ data: fundingRows }, { data: hackRows }, { data: exchangeRows }] = await Promise.all([
    supabase.from('funding_rounds').select('amount_usd, round_type').eq('coin_id', c.id),
    supabase.from('hacks').select('amount_lost_usd').eq('coin_id', c.id),
    supabase.from('coin_exchanges').select('exchange_id').eq('coin_id', c.id),
  ]);

  // Top VC 判定 (簡略版 — RootData 統合後に厳密化)
  const topVcNames = new Set(['a16z', 'paradigm', 'sequoia', 'polychain', 'multicoin', 'animoca brands', 'hashkey']);
  const isLeadByTopVc = false; // TODO: funding_round_investors を join して厳密判定

  const totalRaised = (fundingRows ?? []).reduce((sum, r) => sum + (r.amount_usd ?? 0), 0);

  // FSA 警告のある取引所に上場しているか
  const exchangeIds = (exchangeRows ?? []).map((e) => e.exchange_id);
  let hasFsaWarning = false;
  if (exchangeIds.length) {
    const { data: ex } = await supabase
      .from('exchanges')
      .select('id, fsa_warning')
      .in('id', exchangeIds);
    hasFsaWarning = (ex ?? []).some((e) => e.fsa_warning);
  }

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
      totalRaisedUsd: totalRaised,
      topInvestors: [],
      isLeadByTopVc,
    },
    hacks: {
      count: hackRows?.length ?? 0,
      totalLostUsd: (hackRows ?? []).reduce((s, h) => s + (h.amount_lost_usd ?? 0), 0),
    },
    exchanges: {
      count: exchangeRows?.length ?? 0,
      hasFsaWarning,
    },
  };

  const result = computeTier(inputs);

  // tier_evaluations に詳細記録 (history が残る)
  await supabase.from('tier_evaluations').insert({
    coin_id: c.id,
    tier: result.tier,
    total_score: result.totalScore,
    liquidity_score: result.factors.liquidity,
    team_score: result.factors.team,
    technology_score: result.factors.technology,
    community_score: result.factors.community,
    regulatory_score: result.factors.regulatory,
    future_score: result.factors.future,
    reasoning: { rule_based: result.reasoning, pattern: 'B-individual-investor' },
    llm_model: 'rule-based-v1',
  });

  // coins テーブルの quick lookup 用フィールドも update
  await supabase
    .from('coins')
    .update({
      tier: result.tier,
      tier_score: result.totalScore,
      tier_updated_at: new Date().toISOString(),
    })
    .eq('id', c.id);

  return result.tier;
}

async function main() {
  const supabase = createServiceSupabase();
  let offset = 0;
  const tierCounts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  const startedAt = Date.now();

  while (true) {
    const { data: coins, error } = await supabase
      .from('coins')
      .select('id, symbol, name, market_cap_usd, volume_24h_usd, rank, fdv_usd, circulating_supply, max_supply, created_at')
      .eq('is_active', true)
      .order('rank', { ascending: true, nullsFirst: false })
      .range(offset, offset + BATCH_SIZE - 1);
    if (error) {
      console.error('[compute-tiers] fetch error:', error);
      break;
    }
    if (!coins?.length) break;

    for (const c of coins as RowCoin[]) {
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
  console.log(`[compute-tiers] done · ${durSec}s · distribution:`, tierCounts);
}

main().catch((err) => {
  console.error('[compute-tiers] fatal', err);
  process.exit(1);
});
