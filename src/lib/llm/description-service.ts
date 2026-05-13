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

  // 2. Fetch from CoinGecko
  try {
    const detail = await getCoinDetail(coinId);
    const cgLocale = CG_LOCALE_MAP[locale] ?? 'en';
    const raw =
      detail.description?.[cgLocale]?.trim() ||
      detail.description?.en?.trim() ||
      '';

    if (!raw) {
      // No source copy available — return whatever stale row we have.
      return existing?.description ?? null;
    }

    const cleaned = stripHtml(raw).slice(0, DESCRIPTION_MAX_LENGTH);
    const now = new Date().toISOString();

    await supabase
      .from('coin_translations')
      .upsert(
        {
          coin_id: coinId,
          locale,
          description: cleaned,
          generated_by: 'coingecko-description',
          generated_at: now,
        },
        { onConflict: 'coin_id,locale' },
      );

    return cleaned;
  } catch (e) {
    console.error('[description-service] fetch failed', { coinId, locale, error: e });
    return existing?.description ?? null;
  }
}
