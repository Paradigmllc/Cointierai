/**
 * Coin Description Service — on-demand fetch + cache.
 *
 * Flow:
 *   1. Caller asks for description in {locale}.
 *   2. Lookup coin_translations(coin_id, locale).description — if present and
 *      fresh (< 30 days), return it.
 *   3. Otherwise fetch CoinGecko /coins/{id} (description.{locale}, fallback
 *      to description.en), strip HTML, truncate, and upsert into the table.
 *   4. Graceful degradation: on any error return any older row, then null.
 *
 * Notes:
 *   - We deliberately separate this from summary-service.ts: descriptions are
 *     scraped data (CoinGecko-sourced), summaries are AI-generated. Keeping
 *     them in distinct columns lets ingestion runs evolve independently and
 *     makes copyright/attribution handling auditable.
 *   - Result is locale-targeted; if CoinGecko has no localized copy we fall
 *     back to en so the page always has something tangible to render.
 */
import { createServiceSupabase } from '@/lib/db/supabase';
import { getCoinDetail } from '@/lib/api/coingecko';
import { callOptimized } from '@/lib/llm/cache-optimizer';
import { buildDescriptionTranslateUserPrompt } from '@/lib/tier-evaluation/prompts';
import type { Locale } from '@/types/database';

const DESCRIPTION_TTL_DAYS = 30;
const DESCRIPTION_MAX_LENGTH = 1200;

// CoinGecko locale codes don't exactly match BCP-47; map our app locales.
const CG_LOCALE_MAP: Record<Locale, string> = {
  ja: 'ja',
  en: 'en',
  th: 'th',
  vi: 'vi',
  id: 'id',
  'zh-TW': 'zh-tw',
  ko: 'ko',
};

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getCoinDescription(coinId: string, locale: Locale): Promise<string | null> {
  const supabase = createServiceSupabase();

  // 1. Cache hit?
  const { data: existing } = await supabase
    .from('coin_translations')
    .select('description, generated_at')
    .eq('coin_id', coinId)
    .eq('locale', locale)
    .maybeSingle();

  if (existing?.description) {
    const ageDays = existing.generated_at
      ? (Date.now() - new Date(existing.generated_at).getTime()) / 86_400_000
      : 0;
    if (ageDays < DESCRIPTION_TTL_DAYS) {
      return existing.description;
    }
  }

  // 2. Fetch from CoinGecko — try native locale first, then en.
  try {
    const detail = await getCoinDetail(coinId);
    const cgLocale = CG_LOCALE_MAP[locale] ?? 'en';
    const nativeRaw = detail.description?.[cgLocale]?.trim() ?? '';
    const enRaw = detail.description?.en?.trim() ?? '';

    // If CoinGecko has a native-locale copy, use it as-is.
    if (nativeRaw) {
      return await saveDescription(supabase, coinId, locale, stripHtml(nativeRaw), 'coingecko-description');
    }

    // No native copy — fall through to en source.
    if (!enRaw) {
      return existing?.description ?? null;
    }
    const enCleaned = stripHtml(enRaw).slice(0, DESCRIPTION_MAX_LENGTH);

    // For English, return en directly. For everything else, translate via DeepSeek.
    if (locale === 'en') {
      return await saveDescription(supabase, coinId, locale, enCleaned, 'coingecko-description');
    }

    try {
      const result = await callOptimized({
        promptId: 'description_translate',
        userPrompt: buildDescriptionTranslateUserPrompt({
          targetLocale: locale,
          sourceText: enCleaned,
          coinName: detail.name ?? coinId,
        }),
        temperature: 0.2,
        maxTokens: 800,
      });
      const translated = result.content.trim().slice(0, DESCRIPTION_MAX_LENGTH);
      if (translated) {
        return await saveDescription(supabase, coinId, locale, translated, `deepseek-v4-pro-translate:cache=${result.usage.cached_tokens}`);
      }
    } catch (e) {
      console.error('[description-service] LLM translate failed', { coinId, locale, error: e });
    }

    // Last-resort: persist en so the page renders something instead of a hole.
    return await saveDescription(supabase, coinId, locale, enCleaned, 'coingecko-en-fallback');
  } catch (e) {
    console.error('[description-service] fetch failed', { coinId, locale, error: e });
    return existing?.description ?? null;
  }
}

async function saveDescription(
  supabase: ReturnType<typeof createServiceSupabase>,
  coinId: string,
  locale: Locale,
  text: string,
  generatedBy: string,
): Promise<string> {
  await supabase
    .from('coin_translations')
    .upsert(
      {
        coin_id: coinId,
        locale,
        description: text,
        generated_by: generatedBy,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'coin_id,locale' },
    );
  return text;
}
