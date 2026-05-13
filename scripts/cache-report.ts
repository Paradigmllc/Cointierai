/**
 * scripts/cache-report.ts
 *
 * llm_usage_logs テーブルから cache hit 率 / コスト試算を出力。
 *
 * 出力例:
 *   Endpoint           Requests  Avg prompt  Avg cached  Hit rate  Est cost
 *   coin_summary:ja    1,234     642         580         90.3%     $0.18
 *   tier_eval          37,000    1,250       1,180       94.4%     $5.62
 *
 * 実行: pnpm tsx scripts/cache-report.ts
 *
 * 環境変数で範囲指定可:
 *   SINCE=2026-05-01 pnpm tsx scripts/cache-report.ts
 */

import 'dotenv/config';
import { createServiceSupabase } from '../src/lib/db/supabase';

// OpenRouter 価格 (DeepSeek V4 Pro)
const INPUT_PRICE_PER_M = 0.435;
const OUTPUT_PRICE_PER_M = 0.87;
// Cache 読込価格 (DeepSeek の場合 multiplier 未公開 → 直接 DS の 90%OFF 想定で算出)
const CACHE_READ_MULTIPLIER = parseFloat(process.env.CACHE_READ_MULTIPLIER ?? '0.1');

interface Row {
  endpoint: string;
  model: string;
  prompt_tokens: number;
  cached_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  created_at: string;
}

async function main() {
  const supabase = createServiceSupabase();
  const since = process.env.SINCE ?? new Date(Date.now() - 7 * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from('llm_usage_logs')
    .select('endpoint, model, prompt_tokens, cached_tokens, completion_tokens, latency_ms, created_at')
    .gte('created_at', since)
    .limit(100_000);

  if (error || !data) {
    console.error('[cache-report] fetch error:', error);
    process.exit(1);
  }

  console.log(`[cache-report] analyzing ${data.length} rows since ${since}\n`);

  // Group by endpoint
  const groups = new Map<string, Row[]>();
  for (const r of data as Row[]) {
    const arr = groups.get(r.endpoint) ?? [];
    arr.push(r);
    groups.set(r.endpoint, arr);
  }

  const headers = ['Endpoint', 'Requests', 'Avg prompt', 'Avg cached', 'Hit rate', 'Est cost'];
  const widths = [32, 10, 12, 12, 10, 12];

  console.log(headers.map((h, i) => h.padEnd(widths[i])).join(''));
  console.log('-'.repeat(widths.reduce((s, w) => s + w, 0)));

  let grandRequests = 0;
  let grandPromptTokens = 0;
  let grandCachedTokens = 0;
  let grandCompletionTokens = 0;

  for (const [endpoint, rows] of [...groups.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const requests = rows.length;
    const avgPrompt = rows.reduce((s, r) => s + r.prompt_tokens, 0) / requests;
    const avgCached = rows.reduce((s, r) => s + r.cached_tokens, 0) / requests;
    const hitRate = avgPrompt > 0 ? (avgCached / avgPrompt) * 100 : 0;

    const totalPrompt = rows.reduce((s, r) => s + r.prompt_tokens, 0);
    const totalCached = rows.reduce((s, r) => s + r.cached_tokens, 0);
    const totalCompletion = rows.reduce((s, r) => s + r.completion_tokens, 0);
    const nonCached = totalPrompt - totalCached;
    const inputCost = (nonCached / 1e6) * INPUT_PRICE_PER_M + (totalCached / 1e6) * INPUT_PRICE_PER_M * CACHE_READ_MULTIPLIER;
    const outputCost = (totalCompletion / 1e6) * OUTPUT_PRICE_PER_M;
    const totalCost = inputCost + outputCost;

    console.log(
      [
        endpoint.padEnd(widths[0]),
        requests.toLocaleString().padEnd(widths[1]),
        avgPrompt.toFixed(0).padEnd(widths[2]),
        avgCached.toFixed(0).padEnd(widths[3]),
        `${hitRate.toFixed(1)}%`.padEnd(widths[4]),
        `$${totalCost.toFixed(4)}`.padEnd(widths[5]),
      ].join(''),
    );

    grandRequests += requests;
    grandPromptTokens += totalPrompt;
    grandCachedTokens += totalCached;
    grandCompletionTokens += totalCompletion;
  }

  console.log('-'.repeat(widths.reduce((s, w) => s + w, 0)));
  const grandHitRate = grandPromptTokens > 0 ? (grandCachedTokens / grandPromptTokens) * 100 : 0;
  const grandInputCost =
    ((grandPromptTokens - grandCachedTokens) / 1e6) * INPUT_PRICE_PER_M +
    (grandCachedTokens / 1e6) * INPUT_PRICE_PER_M * CACHE_READ_MULTIPLIER;
  const grandOutputCost = (grandCompletionTokens / 1e6) * OUTPUT_PRICE_PER_M;
  const grandCost = grandInputCost + grandOutputCost;

  console.log(
    [
      'TOTAL'.padEnd(widths[0]),
      grandRequests.toLocaleString().padEnd(widths[1]),
      '—'.padEnd(widths[2]),
      '—'.padEnd(widths[3]),
      `${grandHitRate.toFixed(1)}%`.padEnd(widths[4]),
      `$${grandCost.toFixed(4)}`.padEnd(widths[5]),
    ].join(''),
  );

  console.log('\n========== Cost projection ==========');
  console.log(`Cache read multiplier assumption: ${CACHE_READ_MULTIPLIER}x of input ($${(INPUT_PRICE_PER_M * CACHE_READ_MULTIPLIER).toFixed(4)}/1M)`);
  console.log(`Override via SINCE=YYYY-MM-DD CACHE_READ_MULTIPLIER=0.1 pnpm tsx scripts/cache-report.ts`);

  // 285K pSEO ページ生成試算
  if (grandRequests > 0) {
    const avgRequestCost = grandCost / grandRequests;
    const pSeoCost = avgRequestCost * 285_000;
    console.log(`\nProjected cost for full 285K pSEO page generation: $${pSeoCost.toFixed(2)} (¥${(pSeoCost * 150).toFixed(0)})`);
  }
}

main().catch((err) => {
  console.error('[cache-report] fatal', err);
  process.exit(1);
});
