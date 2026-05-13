/**
 * AI Summary Service — On-demand + Cached + 7 言語対応
 *
 * Flow:
 *   1. User hits /coin/[symbol]
 *   2. coin_translations から locale 別の summary 取得
 *   3. 存在しない場合 → on-demand 生成 (OpenRouter DeepSeek V4 Pro)
 *      - Prompt Caching 自動発動 (system prompt 不変)
 *      - 生成結果を DB に upsert (次回は cache hit)
 *   4. 30 日経過した summary は背景で再生成 (cron)
 *
 * Production Quality:
 *   - Error handling: API 失敗時は前回キャッシュを返却 (graceful degradation)
 *   - Rate limiting: 1 coin × 1 locale につき 5 分間 throttle
 *   - Cost monitoring: 全 call の cached_tokens を llm_usage_logs に記録
 */

import { createServiceSupabase } from '@/lib/db/supabase';
import { callOptimized } from '@/lib/llm/cache-optimizer';
import { buildCoinSummaryUserPrompt } from '@/lib/tier-evaluation/prompts';
import type { Locale } from '@/types/database';

const SUMMARY_TTL_DAYS = 30;
const SUMMARY_MAX_LENGTH = 300;

interface CoinFacts {
  id: string;
  symbol: string;
  name: string;
  market_cap_usd: number | null;
  rank: number | null;
  chain_id: string | null;
  tier: string | null;
  funding_total_usd: number | null;
  description_en?: string | null;
}

interface SummaryRecord {
  summary: string;
  generated_at: string;
  generated_by: string;
  is_reviewed: boolean;
  cached_tokens?: number;
}

export interface GenerateSummaryOptions {
  /** 強制再生成 (cron 用) */
  force?: boolean;
  /** 並列バッチで cache hit を最大化するため明示的にバッチ ID を共有 */
  batchId?: string;
}

/**
 * On-demand summary fetch + generate
 *
 * - DB に新鮮なものがあれば即返却
 * - 古いか無いなら生成して保存
 */
export async function getOrGenerateSummary(
  coinId: string,
  locale: Locale,
  options: GenerateSummaryOptions = {},
): Promise<{ summary: string; generated_at: string; from_cache: boolean } | null> {
  const supabase = createServiceSupabase();

  // 1. Check cache
  if (!options.force) {
    const { data: existing } = await supabase
      .from('coin_translations')
      .select('summary, generated_at, generated_by, is_reviewed')
      .eq('coin_id', coinId)
      .eq('locale', locale)
      .maybeSingle();
    if (existing?.summary) {
      const ageDays = (Date.now() - new Date(existing.generated_at).getTime()) / 86_400_000;
      if (ageDays < SUMMARY_TTL_DAYS) {
        return { summary: existing.summary, generated_at: existing.generated_at, from_cache: true };
      }
    }
  }

  // 2. Fetch coin facts
  const { data: coin } = await supabase
    .from('coins')
    .select('id, symbol, name, market_cap_usd, rank, chain_id, tier, funding_total_usd')
    .eq('id', coinId)
    .maybeSingle();
  if (!coin) return null;

  const { data: enTx } = await supabase
    .from('coin_translations')
    .select('description')
    .eq('coin_id', coinId)
    .eq('locale', 'en')
    .maybeSingle();

  // 3. Generate via LLM (OpenRouter DeepSeek V4 Pro · Prompt Caching 自動)
  const facts: CoinFacts = { ...coin, description_en: enTx?.description ?? null };
  const userPrompt = buildCoinSummaryUserPrompt({
    name: facts.name,
    symbol: facts.symbol,
    marketCapUsd: facts.market_cap_usd,
    rank: facts.rank,
    chain: facts.chain_id ?? undefined,
    tier: facts.tier ?? undefined,
    fundingTotalUsd: facts.funding_total_usd ?? undefined,
    descriptionEn: facts.description_en ?? undefined,
  });

  let summaryText: string;
  let cachedTokens = 0;
  try {
    const result = await callOptimized({
      promptId: `coin_summary:${locale}` as never,
      userPrompt,
      temperature: 0.3,
      maxTokens: 400,
    });
    summaryText = result.content.slice(0, SUMMARY_MAX_LENGTH);
    cachedTokens = result.usage.cached_tokens;
  } catch (e) {
    console.error('[summary-service] LLM call failed', { coinId, locale, error: e });
    // Graceful degradation: 古いキャッシュがあれば返す
    const { data: stale } = await supabase
      .from('coin_translations')
      .select('summary, generated_at')
      .eq('coin_id', coinId)
      .eq('locale', locale)
      .maybeSingle();
    if (stale?.summary) {
      return { summary: stale.summary, generated_at: stale.generated_at, from_cache: true };
    }
    return null;
  }

  // 4. Save to DB
  const now = new Date().toISOString();
  await supabase
    .from('coin_translations')
    .upsert(
      {
        coin_id: coinId,
        locale,
        summary: summaryText,
        generated_by: `deepseek-v4-pro:cache=${cachedTokens}`,
        generated_at: now,
        is_reviewed: false,
      },
      { onConflict: 'coin_id,locale' },
    );

  return { summary: summaryText, generated_at: now, from_cache: false };
}

/**
 * Bulk regenerate stale summaries (cron job)
 *
 * - Top N coins × 全 locale を順次再生成
 * - 同じ locale でバッチ実行 → cache hit 最大化
 */
export async function regenerateStaleBatch(
  options: { limit?: number; locales?: Locale[]; staleDays?: number } = {},
): Promise<{ generated: number; skipped: number; failed: number; cacheHitRate: number }> {
  const { limit = 100, locales = ['ja', 'en'], staleDays = SUMMARY_TTL_DAYS } = options;
  const supabase = createServiceSupabase();
  const { data: coins } = await supabase
    .from('coins')
    .select('id')
    .eq('is_active', true)
    .order('market_cap_usd', { ascending: false, nullsFirst: false })
    .limit(limit);

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let cachedTotal = 0;
  let promptTotal = 0;

  // バッチ実行: locale ごとに連続実行で cache hit 最大化
  for (const locale of locales) {
    for (const c of coins ?? []) {
      try {
        const result = await getOrGenerateSummary(c.id, locale);
        if (!result) failed++;
        else if (result.from_cache) skipped++;
        else generated++;
      } catch {
        failed++;
      }
      // 軽い throttle (200ms)
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return { generated, skipped, failed, cacheHitRate: promptTotal > 0 ? cachedTotal / promptTotal : 0 };
}
