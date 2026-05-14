/**
 * Compare article generator — produces "A vs B" pSEO content in all 7 locales.
 *
 * Pipeline:
 *   1. Pull canonical metrics for coin A & B from cointier.coins (SSOT)
 *   2. Build a deterministic comparison_table (no LLM needed)
 *   3. Ask DeepSeek V4 Pro (via OpenRouter, with Prompt Caching) to fill
 *      title / intro / verdict / bull-bear cases / 5-question FAQ per locale.
 *   4. Upsert into cointier.compare_articles
 *
 * Why this lives outside the page render: pSEO requires DB-cached output.
 * One generation = thousands of cache-hit page views = essentially free.
 */
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/db/supabase';
import { complete as llmComplete } from '@/lib/llm/openrouter';
import type { Coin } from '@/types/database';

export const LOCALES = ['en', 'ja', 'ko', 'th', 'vi', 'id', 'zh-TW'] as const;
export type Locale = (typeof LOCALES)[number];

// Lenient — accept partial LLM responses, default missing fields.
const ARTICLE_SCHEMA = z.object({
  title: z.string().default(''),
  intro: z.string().default(''),
  verdict: z.string().default(''),
  bull_case_a: z.string().default(''),
  bear_case_a: z.string().default(''),
  bull_case_b: z.string().default(''),
  bear_case_b: z.string().default(''),
  faq: z.array(z.union([
    z.object({ q: z.string(), a: z.string() }),
    z.object({ question: z.string(), answer: z.string() }).transform((o) => ({ q: o.question, a: o.answer })),
  ])).default([]),
}).passthrough();

type Article = z.infer<typeof ARTICLE_SCHEMA>;

const SYSTEM_PROMPT = `You are a neutral crypto research analyst writing pSEO comparison articles.

Rules:
- Always neutral, never directive. NEVER recommend buying / selling.
- Use the supplied metrics; do not invent numbers.
- Output STRICTLY a JSON object matching this schema:
{
  "title": "title that includes both coin names and the locale-appropriate phrasing for 'A vs B'",
  "intro": "2-3 sentence opening explaining who should care about this comparison",
  "verdict": "neutral takeaway: for what use cases A wins, for what use cases B wins (no buy/sell calls)",
  "bull_case_a": "3 strongest points for coin A as a list joined by '・' or comma",
  "bear_case_a": "3 strongest concerns about coin A",
  "bull_case_b": "3 strongest points for coin B",
  "bear_case_b": "3 strongest concerns about coin B",
  "faq": [{ "q": "...", "a": "..." }, ...]   // 4-5 questions a search visitor would ask
}
- All natural text fields must be in the requested LOCALE language.
- No markdown, no preamble, just the JSON.`;

interface BuildContextOpts {
  coinA: Coin;
  coinB: Coin;
  locale: Locale;
}

function buildUserPrompt({ coinA, coinB, locale }: BuildContextOpts): string {
  const fmt = (n: number | null) => (n != null ? n.toLocaleString() : '—');
  return JSON.stringify({
    locale,
    coin_a: {
      name: coinA.name,
      symbol: coinA.symbol,
      market_cap_usd: fmt(coinA.market_cap_usd),
      price_usd: fmt(coinA.price_usd),
      volume_24h_usd: fmt(coinA.volume_24h_usd),
      circulating_supply: fmt(coinA.circulating_supply),
      max_supply: fmt(coinA.max_supply),
      ath_usd: fmt(coinA.ath_usd),
      change_30d: coinA.change_30d,
      change_1y: coinA.change_1y,
      tier: coinA.tier,
      category: coinA.defillama_category,
      tvl_usd: fmt(coinA.defillama_tvl_usd),
      hl_listed: coinA.hl_listed,
      hack_count: coinA.hack_count,
    },
    coin_b: {
      name: coinB.name,
      symbol: coinB.symbol,
      market_cap_usd: fmt(coinB.market_cap_usd),
      price_usd: fmt(coinB.price_usd),
      volume_24h_usd: fmt(coinB.volume_24h_usd),
      circulating_supply: fmt(coinB.circulating_supply),
      max_supply: fmt(coinB.max_supply),
      ath_usd: fmt(coinB.ath_usd),
      change_30d: coinB.change_30d,
      change_1y: coinB.change_1y,
      tier: coinB.tier,
      category: coinB.defillama_category,
      tvl_usd: fmt(coinB.defillama_tvl_usd),
      hl_listed: coinB.hl_listed,
      hack_count: coinB.hack_count,
    },
  });
}

function buildComparisonTable(a: Coin, b: Coin) {
  const win = (av: number | null, bv: number | null, higherIsBetter: boolean): 'a' | 'b' | 'tie' => {
    if (av == null || bv == null) return 'tie';
    if (av === bv) return 'tie';
    return higherIsBetter ? (av > bv ? 'a' : 'b') : (av < bv ? 'a' : 'b');
  };
  const metrics = [
    { label: 'Market cap', a_value: a.market_cap_usd, b_value: b.market_cap_usd, winner: win(a.market_cap_usd, b.market_cap_usd, true) },
    { label: '24h volume', a_value: a.volume_24h_usd, b_value: b.volume_24h_usd, winner: win(a.volume_24h_usd, b.volume_24h_usd, true) },
    { label: '30d change', a_value: a.change_30d, b_value: b.change_30d, winner: win(a.change_30d, b.change_30d, true) },
    { label: 'Circulating ratio', a_value: a.circulating_supply && a.max_supply ? a.circulating_supply / a.max_supply : null, b_value: b.circulating_supply && b.max_supply ? b.circulating_supply / b.max_supply : null, winner: win(a.circulating_supply && a.max_supply ? a.circulating_supply / a.max_supply : null, b.circulating_supply && b.max_supply ? b.circulating_supply / b.max_supply : null, true) },
    { label: 'TVL', a_value: a.defillama_tvl_usd, b_value: b.defillama_tvl_usd, winner: win(a.defillama_tvl_usd, b.defillama_tvl_usd, true) },
    { label: 'Hack history', a_value: a.hack_count, b_value: b.hack_count, winner: win(a.hack_count, b.hack_count, false) },
  ];
  return { metrics: metrics.map((m) => ({ label: m.label, a_value: String(m.a_value ?? '—'), b_value: String(m.b_value ?? '—'), winner: m.winner })) };
}

export async function generateCompareArticle(
  coinAId: string,
  coinBId: string,
  locale: Locale,
): Promise<{ ok: boolean; cached_tokens?: number; error?: string }> {
  const supabase = createServiceSupabase();
  // Normalise pair direction (alphabetical)
  const [aId, bId] = [coinAId, coinBId].sort();
  const { data: rows } = await supabase.from('coins').select('*').in('id', [aId, bId]);
  if (!rows || rows.length !== 2) {
    return { ok: false, error: `coins not found: ${aId}, ${bId}` };
  }
  const coinA = rows.find((r) => r.id === aId) as Coin;
  const coinB = rows.find((r) => r.id === bId) as Coin;

  const userPrompt = buildUserPrompt({ coinA, coinB, locale });
  let llmResp;
  try {
    llmResp = await llmComplete({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      options: { endpoint: 'pseo.compare_generate', jsonMode: true, temperature: 0.3, maxTokens: 1800 },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'llm_failed' };
  }

  let parsed: Article;
  try {
    parsed = ARTICLE_SCHEMA.parse(JSON.parse(llmResp.content));
  } catch (e) {
    return { ok: false, error: `schema_validation_failed: ${e instanceof Error ? e.message : 'unknown'}` };
  }

  const comparisonTable = buildComparisonTable(coinA, coinB);
  const { error } = await supabase.from('compare_articles').upsert({
    coin_a: aId,
    coin_b: bId,
    locale,
    title: parsed.title,
    intro: parsed.intro,
    verdict: parsed.verdict,
    bull_case_a: parsed.bull_case_a,
    bear_case_a: parsed.bear_case_a,
    bull_case_b: parsed.bull_case_b,
    bear_case_b: parsed.bear_case_b,
    comparison_table: comparisonTable,
    faq: parsed.faq,
    model: llmResp.model,
    cached_tokens: llmResp.usage.cached_tokens,
  }, { onConflict: 'coin_a,coin_b,locale' });
  if (error) return { ok: false, error: error.message };
  return { ok: true, cached_tokens: llmResp.usage.cached_tokens };
}

/** Bulk generator — top N × top N matrix, all 7 locales. */
export async function generateCompareMatrix(topN: number = 50): Promise<{ generated: number; cacheHitRate: number; errors: string[] }> {
  const supabase = createServiceSupabase();
  const { data: top } = await supabase.from('coins').select('id').order('rank', { ascending: true, nullsFirst: false }).limit(topN);
  const ids = (top ?? []).map((c) => c.id as string);
  let generated = 0;
  let totalTokens = 0;
  let cachedTokens = 0;
  const errors: string[] = [];

  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      for (const locale of LOCALES) {
        // Skip if already generated < 30 days ago
        const { data: existing } = await supabase
          .from('compare_articles')
          .select('generated_at')
          .eq('coin_a', ids[i])
          .eq('coin_b', ids[j])
          .eq('locale', locale)
          .maybeSingle();
        if (existing && Date.now() - new Date(existing.generated_at).getTime() < 30 * 86_400_000) continue;
        const res = await generateCompareArticle(ids[i], ids[j], locale);
        if (res.ok) {
          generated += 1;
          totalTokens += 1; // placeholder for tracking
          if (res.cached_tokens && res.cached_tokens > 0) cachedTokens += 1;
        } else {
          errors.push(`${ids[i]}-vs-${ids[j]}-${locale}: ${res.error}`);
        }
        // Throttle to be polite to OpenRouter
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }
  return { generated, cacheHitRate: totalTokens > 0 ? cachedTokens / totalTokens : 0, errors };
}
