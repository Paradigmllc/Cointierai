import OpenAI from 'openai';
import { createServiceSupabase } from '@/lib/db/supabase';

/**
 * OpenRouter — 唯一の LLM ゲートウェイ
 *
 * グローバルルール (CLAUDE.md s10-5):
 *   - 全 LLM 呼び出しはここを経由する (直接 fetch 禁止)
 *   - 将来モデル変更は OPENROUTER_DEFAULT_MODEL の 1 行変更で全コードに反映
 *   - 全レスポンスの cached_tokens を Supabase llm_usage_logs に記録
 *
 * モデル戦略:
 *   - text:  deepseek/deepseek-v4-pro  ($0.435/$0.87 per 1M・Prompt Caching 自動)
 *   - vision: google/gemini-2.5-flash  (PDF / 画像 OCR)
 *
 * Prompt Caching:
 *   - DeepSeek は cache_control 不要・プレフィックス一致で自動発動
 *   - システムプロンプトを先頭固定にすると hit 率が最大化
 *   - usage.prompt_tokens_details.cached_tokens で検証
 */

const API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.OPENROUTER_SITE_URL ?? 'https://cointier.ai';
const APP_NAME = process.env.OPENROUTER_APP_NAME ?? 'Cointier';

export const DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL ?? 'deepseek/deepseek-v4-pro';
export const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL ?? 'google/gemini-2.5-flash';

function client(): OpenAI {
  if (!API_KEY) {
    throw new Error(
      '[openrouter] OPENROUTER_API_KEY is not set. See ~/.claude/projects/D--dev-cointierai/memory/reference_api_keys.md (流用元: appexxme/memory:452)',
    );
  }
  return new OpenAI({
    apiKey: API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': SITE_URL,
      'X-Title': APP_NAME,
    },
  });
}

export interface LlmUsage {
  prompt_tokens: number;
  cached_tokens: number;
  cache_write_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LlmResponse<T = string> {
  content: T;
  usage: LlmUsage;
  model: string;
  latencyMs: number;
  finishReason: string | null;
}

interface CallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  /** 識別用 (Supabase ログに保存される endpoint 名) */
  endpoint: string;
  userId?: string;
}

/**
 * 統一テキスト生成 — システムプロンプトが先頭固定で Prompt Caching を最大化
 *
 * @example
 *   const result = await complete({
 *     systemPrompt: COIN_SUMMARY_SYSTEM_PROMPT_JA,
 *     userPrompt: `銘柄: ${name}, カテゴリ: ${category}`,
 *     endpoint: 'coin_summary',
 *   });
 */
export async function complete(args: {
  systemPrompt: string;
  userPrompt: string;
  options: CallOptions;
}): Promise<LlmResponse<string>> {
  const { systemPrompt, userPrompt, options } = args;
  const model = options.model ?? DEFAULT_MODEL;
  const t0 = Date.now();

  const openai = client();
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 1024,
    response_format: options.jsonMode ? { type: 'json_object' } : undefined,
  });

  const latencyMs = Date.now() - t0;
  const usage = extractUsage(response);
  const content = response.choices[0]?.message?.content ?? '';
  const finishReason = response.choices[0]?.finish_reason ?? null;

  // Fire-and-forget logging (不要なら no-op だが必須監視 — CLAUDE.md s10-5)
  void logUsage({
    endpoint: options.endpoint,
    model,
    usage,
    latencyMs,
    userId: options.userId,
    requestId: response.id,
  });

  return { content, usage, model, latencyMs, finishReason };
}

/**
 * JSON 出力専用 (structured output)
 */
export async function completeJson<T = unknown>(args: {
  systemPrompt: string;
  userPrompt: string;
  options: CallOptions;
}): Promise<LlmResponse<T>> {
  const result = await complete({ ...args, options: { ...args.options, jsonMode: true } });
  try {
    const parsed = JSON.parse(result.content) as T;
    return { ...result, content: parsed };
  } catch (e) {
    console.error('[openrouter] JSON parse failed', { content: result.content, error: e });
    throw new Error('LLM returned invalid JSON');
  }
}

// ============ Internal ============

function extractUsage(response: { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; prompt_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number } } }): LlmUsage {
  const u = response.usage ?? {};
  const details = u.prompt_tokens_details ?? {};
  return {
    prompt_tokens: u.prompt_tokens ?? 0,
    cached_tokens: details.cached_tokens ?? 0,
    cache_write_tokens: details.cache_write_tokens ?? 0,
    completion_tokens: u.completion_tokens ?? 0,
    total_tokens: u.total_tokens ?? 0,
  };
}

async function logUsage(args: { endpoint: string; model: string; usage: LlmUsage; latencyMs: number; userId?: string; requestId: string }) {
  try {
    const supabase = createServiceSupabase();
    await supabase.from('llm_usage_logs').insert({
      endpoint: args.endpoint,
      model: args.model,
      prompt_tokens: args.usage.prompt_tokens,
      cached_tokens: args.usage.cached_tokens,
      cache_write_tokens: args.usage.cache_write_tokens,
      completion_tokens: args.usage.completion_tokens,
      latency_ms: args.latencyMs,
      user_id: args.userId ?? null,
      request_id: args.requestId,
    });
  } catch (e) {
    // Logging 失敗で本番処理を止めない (cache 監視は best-effort)
    console.error('[openrouter] usage log failed', e);
  }
}
