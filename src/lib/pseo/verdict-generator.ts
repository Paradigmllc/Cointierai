/**
 * Coin Verdict generator — per-coin AI Bull/Bear analysis.
 *
 * Writes to cointier.coin_verdicts (coin_id × locale). Renders in the
 * hero of /coin/[symbol] as the "Cointier AI verdict" card.
 *
 * Cost: 7 locales × 17K coins = 119K rows. With DeepSeek Cache hit ~90%
 * the effective cost is roughly 119K × $0.0003 ≈ $36 total to seed once.
 */
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/db/supabase';
import { complete as llmComplete } from '@/lib/llm/openrouter';
import type { Coin } from '@/types/database';
import { LOCALES, type Locale } from './compare-generator';

const VERDICT_SCHEMA = z.object({
  verdict: z.string().min(2).max(40),
  verdict_score: z.number().min(-1).max(1),
  tldr: z.string().min(20).max(280),
  bull_case: z.array(z.object({ point: z.string(), evidence_url: z.string().optional() })).min(2).max(3),
  bear_case: z.array(z.object({ point: z.string(), evidence_url: z.string().optional() })).min(2).max(3),
  catalysts: z.array(z.object({ title: z.string(), date: z.string().optional(), impact: z.string().optional() })).max(3).default([]),
  risk_factors: z.array(z.object({ factor: z.string() })).max(4).default([]),
  time_horizon: z.enum(['1d', '1w', '1m', '6m+']).default('1m'),
  confidence: z.number().min(0).max(1),
});

type VerdictPayload = z.infer<typeof VERDICT_SCHEMA>;

const SYSTEM_PROMPT = `You are Cointier's neutral AI crypto analyst. Produce a structured Bull/Bear verdict per coin.

Rules:
- Neutral and educational. Use phrases like "long-term holders may consider" / "短期では" / "factors to watch".
- NEVER directly recommend buy/sell. The verdict field uses values like:
  - English: "Strong fundamentals" / "Wait & see" / "High volatility" / "Caution"
  - Japanese: "長期向け良好" / "様子見" / "ボラ高い" / "注意"
  - 韓国語/タイ語/ベトナム語/インドネシア語/繁体字: similar neutral phrasing in the requested locale.
- verdict_score: -1 (strongly cautious) … 0 (neutral) … +1 (strongly constructive). Calibrate against fundamentals.
- catalysts: upcoming events that could move price (unlocks, halving, ETF decision). Empty array if unknown.
- Output strictly JSON matching the schema. No markdown, no preamble.`;

function buildUserPrompt(coin: Coin, locale: Locale): string {
  return JSON.stringify({
    locale,
    coin: {
      name: coin.name,
      symbol: coin.symbol,
      tier: coin.tier,
      rank: coin.rank,
      market_cap_usd: coin.market_cap_usd,
      fdv_usd: coin.fdv_usd,
      volume_24h_usd: coin.volume_24h_usd,
      circulating_supply: coin.circulating_supply,
      max_supply: coin.max_supply,
      ath_usd: coin.ath_usd,
      ath_date: coin.ath_date,
      change_30d: coin.change_30d,
      change_1y: coin.change_1y,
      defillama_category: coin.defillama_category,
      tvl_usd: coin.defillama_tvl_usd,
      hack_count: coin.hack_count,
      hl_listed: coin.hl_listed,
      hl_open_interest_usd: coin.hl_open_interest_usd,
      lc_galaxy_score: coin.lc_galaxy_score,
      lc_sentiment: coin.lc_sentiment,
      funding_total_usd: coin.funding_total_usd,
      funding_round_count: coin.funding_round_count,
    },
  });
}

export async function generateVerdict(coinId: string, locale: Locale): Promise<{ ok: boolean; cached_tokens?: number; error?: string }> {
  const supabase = createServiceSupabase();
  const { data: coin } = await supabase.from('coins').select('*').eq('id', coinId).maybeSingle();
  if (!coin) return { ok: false, error: 'coin_not_found' };

  let resp;
  try {
    resp = await llmComplete({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(coin as Coin, locale),
      options: { endpoint: 'pseo.verdict_generate', jsonMode: true, temperature: 0.4, maxTokens: 1200 },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'llm_failed' };
  }

  let parsed: VerdictPayload;
  try {
    parsed = VERDICT_SCHEMA.parse(JSON.parse(resp.content));
  } catch (e) {
    return { ok: false, error: `schema_validation: ${e instanceof Error ? e.message : 'unknown'}` };
  }

  const { error } = await supabase.from('coin_verdicts').upsert({
    coin_id: coinId,
    locale,
    verdict: parsed.verdict,
    verdict_score: parsed.verdict_score,
    tldr: parsed.tldr,
    bull_case: parsed.bull_case,
    bear_case: parsed.bear_case,
    catalysts: parsed.catalysts,
    risk_factors: parsed.risk_factors,
    time_horizon: parsed.time_horizon,
    confidence: parsed.confidence,
    model: resp.model,
    cached_tokens: resp.usage.cached_tokens,
  }, { onConflict: 'coin_id,locale' });
  if (error) return { ok: false, error: error.message };
  return { ok: true, cached_tokens: resp.usage.cached_tokens };
}

export async function generateVerdictsBatch(opts: { topN: number; locales?: Locale[]; refreshAfterDays?: number } = { topN: 100 }): Promise<{ generated: number; skipped: number; errors: string[] }> {
  const { topN, locales = LOCALES, refreshAfterDays = 30 } = opts;
  const supabase = createServiceSupabase();
  const { data: top } = await supabase.from('coins').select('id').order('rank', { ascending: true, nullsFirst: false }).limit(topN);
  const ids = (top ?? []).map((c) => c.id as string);
  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const id of ids) {
    for (const locale of locales) {
      const { data: existing } = await supabase
        .from('coin_verdicts')
        .select('generated_at')
        .eq('coin_id', id)
        .eq('locale', locale)
        .maybeSingle();
      if (existing && Date.now() - new Date(existing.generated_at).getTime() < refreshAfterDays * 86_400_000) {
        skipped += 1;
        continue;
      }
      const r = await generateVerdict(id, locale);
      if (r.ok) generated += 1; else errors.push(`${id}-${locale}: ${r.error}`);
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return { generated, skipped, errors };
}
