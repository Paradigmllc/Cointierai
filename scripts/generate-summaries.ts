/**
 * scripts/generate-summaries.ts
 *
 * LLM 銘柄解説生成パイプライン (OpenRouter + DeepSeek V4 Pro)
 *
 * 中立教育者風プロンプト (prompts.ts) で 7 言語のサマリーを生成 → coin_translations へ保存
 *
 * Prompt Caching を最大化するため:
 *   - system prompt 先頭固定
 *   - locale 単位でバッチ実行 (同じ system prompt の連続呼び出し)
 *   - 同じ system prompt は cached_tokens 90%OFF を期待
 *
 * 実行:
 *   pnpm tsx scripts/generate-summaries.ts                 # 全 locale × 全 coin
 *   LOCALE=ja LIMIT=100 pnpm tsx scripts/generate-summaries.ts  # 部分実行
 */

import 'dotenv/config';
import { createServiceSupabase } from '../src/lib/db/supabase';
import { complete } from '../src/lib/llm/openrouter';
import {
  COIN_SUMMARY_PROMPTS,
  buildCoinSummaryUserPrompt,
} from '../src/lib/tier-evaluation/prompts';
import type { Locale } from '../src/types/database';

const ALL_LOCALES: Locale[] = ['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'];
const LIMIT = parseInt(process.env.LIMIT ?? '500', 10);
const SLEEP_MS = parseInt(process.env.SLEEP_MS ?? '200', 10);
const TARGET_LOCALE = (process.env.LOCALE as Locale | undefined) ?? null;

async function generateForLocale(locale: Locale) {
  const supabase = createServiceSupabase();
  const systemPrompt = COIN_SUMMARY_PROMPTS[locale];
  if (!systemPrompt) {
    console.warn(`[summaries] No prompt for locale ${locale}`);
    return;
  }

  // 未生成の coin を取得 (left join で coin_translations をチェック)
  const { data: coins } = await supabase
    .from('coins')
    .select(`
      id, symbol, name, rank, market_cap_usd, chain_id, tier,
      coin_translations!left(coin_id, locale, summary)
    `)
    .eq('is_active', true)
    .order('market_cap_usd', { ascending: false, nullsFirst: false })
    .limit(LIMIT);

  if (!coins) return;

  let generated = 0;
  let cachedSum = 0;
  let totalSum = 0;
  const startedAt = Date.now();

  for (const c of coins) {
    // Skip if already generated
    const translations = (c.coin_translations as Array<{ locale: string; summary: string | null }>) ?? [];
    const existing = translations.find((t) => t.locale === locale && t.summary);
    if (existing) continue;

    // EN description を base に
    const enTx = translations.find((t) => t.locale === 'en');
    const userPrompt = buildCoinSummaryUserPrompt({
      name: c.name,
      symbol: c.symbol,
      marketCapUsd: c.market_cap_usd,
      rank: c.rank,
      chain: c.chain_id ?? undefined,
      tier: c.tier ?? undefined,
      descriptionEn: (enTx as { description?: string } | undefined)?.description ?? undefined,
    });

    try {
      const result = await complete({
        systemPrompt,
        userPrompt,
        options: { endpoint: 'coin_summary', temperature: 0.3, maxTokens: 400 },
      });

      await supabase.from('coin_translations').upsert(
        {
          coin_id: c.id,
          locale,
          summary: result.content.slice(0, 300),
          generated_by: result.model,
          is_reviewed: false,
        },
        { onConflict: 'coin_id,locale' },
      );

      generated++;
      cachedSum += result.usage.cached_tokens;
      totalSum += result.usage.prompt_tokens;

      if (generated % 20 === 0) {
        const cacheHitRate = totalSum > 0 ? ((cachedSum / totalSum) * 100).toFixed(1) : '0';
        console.log(`[summaries:${locale}] ${generated}/${coins.length} · cache hit ${cacheHitRate}%`);
      }
    } catch (e) {
      console.warn(`[summaries:${locale}] failed for ${c.symbol}:`, e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }

  const durSec = Math.round((Date.now() - startedAt) / 1000);
  const cacheHitRate = totalSum > 0 ? ((cachedSum / totalSum) * 100).toFixed(1) : '0';
  console.log(`[summaries:${locale}] done · ${generated} generated · ${durSec}s · final cache hit rate: ${cacheHitRate}%`);
}

async function main() {
  const locales = TARGET_LOCALE ? [TARGET_LOCALE] : ALL_LOCALES;
  console.log('[summaries] start · locales:', locales.join(', '));
  for (const locale of locales) {
    await generateForLocale(locale);
  }
}

main().catch((err) => {
  console.error('[summaries] fatal', err);
  process.exit(1);
});
