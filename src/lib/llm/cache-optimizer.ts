/**
 * DeepSeek (OpenRouter 経由) Prompt Caching 最適化レイヤー
 *
 * 90% OFF cache hit を最大化するための 4 大原則:
 *   1. システムプロンプトは **byte-for-byte 同一**を維持 (バージョン管理 + ハッシュ照合)
 *   2. order を固定: system → static context → dynamic user
 *   3. 同じ system prompt のリクエストを **連続バッチ** で投げる
 *   4. 動的要素 (timestamp, request_id 等) は system / static context に絶対入れない
 *
 * 285K pSEO ページの解説生成では cache hit 率 80%+ を目指す。
 * 直接 DeepSeek 90%OFF が OpenRouter 経由で透過するか初月実測する。
 */

import { createHash } from 'node:crypto';
import { complete, completeJson, type LlmResponse, type LlmUsage } from './openrouter';
import {
  COIN_SUMMARY_PROMPTS,
  TIER_EVAL_SYSTEM_PROMPT,
  DESCRIPTION_TRANSLATE_SYSTEM_PROMPT,
} from '@/lib/tier-evaluation/prompts';

// ============ Prompt registry (バージョン管理 + cache hash) ============

interface PromptVersion {
  id: string;
  version: string;
  systemPrompt: string;
  hash: string;
  introduced: string;
}

function hashPrompt(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 12);
}

/**
 * 登録済みプロンプト一覧 — 各エンドポイントの system prompt と hash を一元管理
 *
 * **重要**: 既存 hash を変更すると 285K coin の cached_tokens がリセットされ
 * 初月再生成コストが発生する。変更は週次バッチでまとめる (T-PLUS ルール準拠)。
 */
export const PROMPT_REGISTRY: Record<string, PromptVersion> = {
  'coin_summary:ja': {
    id: 'coin_summary:ja',
    version: 'v1-pattern-b-educator',
    systemPrompt: COIN_SUMMARY_PROMPTS.ja,
    hash: hashPrompt(COIN_SUMMARY_PROMPTS.ja),
    introduced: '2026-05-13',
  },
  'coin_summary:en': {
    id: 'coin_summary:en',
    version: 'v1-pattern-b-educator',
    systemPrompt: COIN_SUMMARY_PROMPTS.en,
    hash: hashPrompt(COIN_SUMMARY_PROMPTS.en),
    introduced: '2026-05-13',
  },
  'coin_summary:th': { id: 'coin_summary:th', version: 'v1', systemPrompt: COIN_SUMMARY_PROMPTS.th, hash: hashPrompt(COIN_SUMMARY_PROMPTS.th), introduced: '2026-05-13' },
  'coin_summary:vi': { id: 'coin_summary:vi', version: 'v1', systemPrompt: COIN_SUMMARY_PROMPTS.vi, hash: hashPrompt(COIN_SUMMARY_PROMPTS.vi), introduced: '2026-05-13' },
  'coin_summary:id': { id: 'coin_summary:id', version: 'v1', systemPrompt: COIN_SUMMARY_PROMPTS.id, hash: hashPrompt(COIN_SUMMARY_PROMPTS.id), introduced: '2026-05-13' },
  'coin_summary:zh-TW': { id: 'coin_summary:zh-TW', version: 'v1', systemPrompt: COIN_SUMMARY_PROMPTS['zh-TW'], hash: hashPrompt(COIN_SUMMARY_PROMPTS['zh-TW']), introduced: '2026-05-13' },
  'coin_summary:ko': { id: 'coin_summary:ko', version: 'v1', systemPrompt: COIN_SUMMARY_PROMPTS.ko, hash: hashPrompt(COIN_SUMMARY_PROMPTS.ko), introduced: '2026-05-13' },
  'tier_eval': {
    id: 'tier_eval',
    version: 'v1-pattern-b',
    systemPrompt: TIER_EVAL_SYSTEM_PROMPT,
    hash: hashPrompt(TIER_EVAL_SYSTEM_PROMPT),
    introduced: '2026-05-13',
  },
  'description_translate': {
    id: 'description_translate',
    version: 'v1',
    systemPrompt: DESCRIPTION_TRANSLATE_SYSTEM_PROMPT,
    hash: hashPrompt(DESCRIPTION_TRANSLATE_SYSTEM_PROMPT),
    introduced: '2026-05-13',
  },
};

export function getRegisteredPrompt(id: string): PromptVersion {
  const p = PROMPT_REGISTRY[id];
  if (!p) throw new Error(`[cache-optimizer] Prompt not registered: ${id}`);
  return p;
}

// ============ Cache-aware wrapper ============

interface OptimizedCallArgs {
  promptId: keyof typeof PROMPT_REGISTRY;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
}

/**
 * Cache-optimized LLM call — promptId で system prompt を解決し
 * cached_tokens 検証付きで実行
 */
export async function callOptimized(args: OptimizedCallArgs): Promise<LlmResponse<string> & { cacheHitRate: number }> {
  const prompt = getRegisteredPrompt(args.promptId);
  const result = await complete({
    systemPrompt: prompt.systemPrompt,
    userPrompt: args.userPrompt,
    options: {
      endpoint: args.promptId,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      userId: args.userId,
    },
  });
  const cacheHitRate = result.usage.prompt_tokens > 0
    ? result.usage.cached_tokens / result.usage.prompt_tokens
    : 0;
  return { ...result, cacheHitRate };
}

/**
 * Cache-optimized JSON output (tier evaluation 用)
 */
export async function callOptimizedJson<T = unknown>(args: OptimizedCallArgs): Promise<LlmResponse<T> & { cacheHitRate: number }> {
  const prompt = getRegisteredPrompt(args.promptId);
  const result = await completeJson<T>({
    systemPrompt: prompt.systemPrompt,
    userPrompt: args.userPrompt,
    options: {
      endpoint: args.promptId,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      userId: args.userId,
      jsonMode: true,
    },
  });
  const cacheHitRate = result.usage.prompt_tokens > 0
    ? result.usage.cached_tokens / result.usage.prompt_tokens
    : 0;
  return { ...result, cacheHitRate };
}

// ============ Batch executor (cache hit 最大化) ============

/**
 * 同じ promptId のリクエストを **連続実行** することで cache hit 率を最大化する。
 *
 * 並列実行は OpenRouter の cache に hit しにくいため、直列処理 + 短い sleep が最適。
 */
export async function executeBatch<T = string>(args: {
  promptId: keyof typeof PROMPT_REGISTRY;
  inputs: Array<{ userPrompt: string; meta?: Record<string, unknown> }>;
  sleepMsBetween?: number;
  jsonMode?: boolean;
  onProgress?: (done: number, total: number, runningCacheRate: number) => void;
}): Promise<Array<{ content: T; usage: LlmUsage; meta?: Record<string, unknown> }>> {
  const { promptId, inputs, sleepMsBetween = 100, jsonMode = false, onProgress } = args;
  const results: Array<{ content: T; usage: LlmUsage; meta?: Record<string, unknown> }> = [];
  let cachedTotal = 0;
  let promptTotal = 0;

  for (let i = 0; i < inputs.length; i++) {
    const { userPrompt, meta } = inputs[i];
    try {
      const r = jsonMode
        ? await callOptimizedJson<T>({ promptId, userPrompt })
        : (await callOptimized({ promptId, userPrompt })) as unknown as { content: T; usage: LlmUsage };
      results.push({ content: r.content, usage: r.usage, meta });
      cachedTotal += r.usage.cached_tokens;
      promptTotal += r.usage.prompt_tokens;
      if (onProgress) {
        onProgress(i + 1, inputs.length, promptTotal > 0 ? cachedTotal / promptTotal : 0);
      }
    } catch (e) {
      console.error('[cache-optimizer] batch item failed', { i, error: e });
    }
    if (sleepMsBetween && i < inputs.length - 1) {
      await new Promise((r) => setTimeout(r, sleepMsBetween));
    }
  }

  return results;
}

/**
 * 起動時 self-check: registered prompts の hash を console 出力 (debug)
 */
export function logRegisteredHashes() {
  console.log('[cache-optimizer] Registered prompt hashes:');
  for (const p of Object.values(PROMPT_REGISTRY)) {
    console.log(`  ${p.id.padEnd(30)} ${p.version.padEnd(25)} hash=${p.hash}`);
  }
}
