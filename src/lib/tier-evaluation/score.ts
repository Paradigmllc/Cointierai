/**
 * Tier 評価エンジン — 6 軸 AI 算出
 *
 * 入力: Coin (price/marketcap/...) + FundingRounds + Hacks + DEX data
 * 出力: { tier: S/A/B/C/D/F, score: 0-100, factors: {...} }
 *
 * ====================================================================
 * 🎯 ここは「あなたの判断が最も価値のある」コア意思決定ポイントです
 * ====================================================================
 *
 * 6 軸の WEIGHT 配分次第で、Cointier がどんな投資家層に刺さるかが決まる:
 *
 * パターン A:「機関向け」(Liquidity 重視・Regulatory 重視)
 *   liquidity 0.30 / team 0.15 / technology 0.10 / community 0.05 / regulatory 0.30 / future 0.10
 *   → 機関投資家の DD ツールとして信頼性高い
 *   → 草コイン・MEME はほぼ F に
 *
 * パターン B:「個人投資家向け」(Future 重視・Community 重視 = 上昇期待)
 *   liquidity 0.10 / team 0.15 / technology 0.15 / community 0.25 / regulatory 0.10 / future 0.25
 *   → 投機性高い銘柄も S/A になりうる
 *   → 「次のソラナを見つける」ニーズに刺さる
 *
 * パターン C:「バランス型」(全軸均等)
 *   各軸 0.166...
 *   → CryptoRank.io 的中庸 → 競合との差別化弱い
 *
 * Notion 設計書では「アジア個人投資家向け」「Bloomberg vs ライトな診断」の
 * 二択がまだ確定していない (10-7 未確定事項)。これによって WEIGHTS が決まる。
 *
 * Tier threshold も判断点:
 *   - 厳格: S >= 95 (Top 0.5%)・A >= 85・B >= 70・C >= 50・D >= 30・F < 30
 *   - 緩め: S >= 80 (Top 5%)・A >= 65・B >= 50・C >= 35・D >= 20・F < 20
 *
 * TODO(you): WEIGHTS と THRESHOLDS を確定してください。
 *            上記コメントを read してパターン A/B/C を選ぶか、独自値を決める。
 */

import type { Tier } from '@/types/database';

// ============ 🎯 USER INPUT REQUIRED ============
// 以下の数値を確定してください (合計 = 1.0)
export const FACTOR_WEIGHTS = {
  liquidity: 0.20,   // TODO(you): adjust
  team: 0.15,        // TODO(you): adjust
  technology: 0.15,  // TODO(you): adjust
  community: 0.15,   // TODO(you): adjust
  regulatory: 0.20,  // TODO(you): adjust
  future: 0.15,      // TODO(you): adjust
} as const;
// ※ 上記はパターン C (バランス型) と A (機関向け) の中間で仮置き

// Tier threshold (合計スコア → ランク)
export const TIER_THRESHOLDS: Array<{ tier: Tier; min: number }> = [
  { tier: 'S', min: 85 },  // TODO(you): adjust (現状: 厳格め)
  { tier: 'A', min: 70 },
  { tier: 'B', min: 55 },
  { tier: 'C', min: 40 },
  { tier: 'D', min: 25 },
  { tier: 'F', min: 0 },
];

// ============ Factor inputs ============
export interface TierInputs {
  coin: {
    symbol: string;
    name: string;
    marketCap: number | null;
    volume24h: number | null;
    rank: number | null;
    fdv: number | null;
    circulatingSupply: number | null;
    maxSupply: number | null;
    age_days?: number;
  };
  funding?: {
    totalRaisedUsd: number;
    topInvestors: string[];
    isLeadByTopVc: boolean;
  };
  hacks?: {
    count: number;
    totalLostUsd: number;
  };
  exchanges?: {
    count: number;
    hasFsaWarning: boolean;
  };
  dex?: {
    pairCount: number;
    totalLiquidityUsd: number;
  };
  community?: {
    githubStars?: number;
    twitterFollowers?: number;
  };
}

export interface TierResult {
  tier: Tier;
  totalScore: number;
  factors: Record<keyof typeof FACTOR_WEIGHTS, number>;
  reasoning: string;
}

// ============ 各軸の算出関数 (rule-based first, LLM augmentation later) ============

function scoreLiquidity(i: TierInputs): number {
  const { marketCap, volume24h } = i.coin;
  if (!marketCap || !volume24h) return 30;
  // volume / mcap ratio = 健全な流動性 (0.05 以上が望ましい)
  const ratio = volume24h / marketCap;
  let score = 0;
  if (ratio >= 0.10) score = 95;
  else if (ratio >= 0.05) score = 80;
  else if (ratio >= 0.02) score = 60;
  else if (ratio >= 0.01) score = 45;
  else score = 25;
  // DEX 流動性ボーナス
  if (i.dex?.totalLiquidityUsd && i.dex.totalLiquidityUsd > 10_000_000) score = Math.min(100, score + 5);
  // 取引所カバレッジ
  if (i.exchanges?.count && i.exchanges.count >= 10) score = Math.min(100, score + 5);
  return score;
}

function scoreTeam(i: TierInputs): number {
  // 資金調達履歴 + リード VC の質
  if (!i.funding || i.funding.totalRaisedUsd === 0) return 40;  // 不明 = 中庸
  let score = 50;
  if (i.funding.totalRaisedUsd >= 50_000_000) score += 25;
  else if (i.funding.totalRaisedUsd >= 10_000_000) score += 15;
  else if (i.funding.totalRaisedUsd >= 1_000_000) score += 5;
  if (i.funding.isLeadByTopVc) score += 15;
  return Math.min(100, score);
}

function scoreTechnology(i: TierInputs): number {
  // GitHub stars と既存ハック履歴の組み合わせ
  let score = 50;
  if (i.community?.githubStars) {
    if (i.community.githubStars >= 1000) score += 25;
    else if (i.community.githubStars >= 100) score += 15;
    else if (i.community.githubStars >= 10) score += 5;
  }
  if (i.hacks?.count && i.hacks.count > 0) {
    score -= Math.min(40, i.hacks.count * 15);
    if (i.hacks.totalLostUsd > 10_000_000) score -= 10;
  }
  return Math.max(0, Math.min(100, score));
}

function scoreCommunity(i: TierInputs): number {
  let score = 40;
  if (i.community?.twitterFollowers) {
    if (i.community.twitterFollowers >= 1_000_000) score += 35;
    else if (i.community.twitterFollowers >= 100_000) score += 25;
    else if (i.community.twitterFollowers >= 10_000) score += 15;
    else if (i.community.twitterFollowers >= 1_000) score += 5;
  }
  // rank も community のプロキシ
  if (i.coin.rank && i.coin.rank <= 50) score += 15;
  return Math.min(100, score);
}

function scoreRegulatory(i: TierInputs): number {
  let score = 70;
  if (i.exchanges?.hasFsaWarning) score -= 30;
  if (i.coin.rank && i.coin.rank <= 100) score += 10;  // 主要銘柄は規制クリア前提
  return Math.max(0, Math.min(100, score));
}

function scoreFuture(i: TierInputs): number {
  // FDV vs circulating ratio (将来の希薄化リスク)
  let score = 60;
  if (i.coin.fdv && i.coin.marketCap) {
    const ratio = i.coin.marketCap / i.coin.fdv;
    if (ratio >= 0.8) score += 25;   // ほぼ流通済 = アンロック圧力低い
    else if (ratio >= 0.5) score += 15;
    else if (ratio >= 0.3) score += 5;
    else score -= 15;                 // 大量アンロック圧力
  }
  if (i.coin.rank && i.coin.rank <= 20) score += 10;
  return Math.max(0, Math.min(100, score));
}

// ============ Main ============

export function computeTier(inputs: TierInputs): TierResult {
  const factors = {
    liquidity:  scoreLiquidity(inputs),
    team:       scoreTeam(inputs),
    technology: scoreTechnology(inputs),
    community:  scoreCommunity(inputs),
    regulatory: scoreRegulatory(inputs),
    future:     scoreFuture(inputs),
  };

  const totalScore =
    factors.liquidity  * FACTOR_WEIGHTS.liquidity  +
    factors.team       * FACTOR_WEIGHTS.team       +
    factors.technology * FACTOR_WEIGHTS.technology +
    factors.community  * FACTOR_WEIGHTS.community  +
    factors.regulatory * FACTOR_WEIGHTS.regulatory +
    factors.future     * FACTOR_WEIGHTS.future;

  const tier = (TIER_THRESHOLDS.find((t) => totalScore >= t.min)?.tier) ?? 'F';

  const reasoning = `liq=${factors.liquidity.toFixed(0)} team=${factors.team.toFixed(0)} tech=${factors.technology.toFixed(0)} comm=${factors.community.toFixed(0)} reg=${factors.regulatory.toFixed(0)} fut=${factors.future.toFixed(0)} → ${totalScore.toFixed(1)}`;

  return { tier, totalScore: Math.round(totalScore * 10) / 10, factors, reasoning };
}
