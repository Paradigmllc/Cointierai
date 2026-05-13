/**
 * scripts/translate-hacks.ts
 *
 * DeFiLlama Hacks DB を 7 言語に翻訳 (Notion L3027-3034)
 *
 * 「このプロジェクトは過去にハックされましたか」
 *   → 「2023 年 3 月に $5M 流出、原因はリエントランシー攻撃 (関数が
 *      自分自身を再帰呼び出しできてしまう脆弱性) です」
 *   → CoinGecko/CryptoRank にない独自情報 = 差別化コア
 *
 * OpenRouter + DeepSeek V4 Pro 経由・Prompt Caching 自動発動
 */

import 'dotenv/config';
import { createServiceSupabase } from '../src/lib/db/supabase';
import { callOptimizedJson } from '../src/lib/llm/cache-optimizer';

const TARGET_LOCALES = ['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'] as const;

const HACK_TRANSLATION_PROMPT = `あなたは暗号資産プロジェクトのセキュリティ事故を「中立教育者」として 7 言語に翻訳する専門家です。

入力: プロトコル名・流出額・原因・日付
出力 (JSON):
{
  "translations": {
    "ja": { "description": "...", "lessons_learned": "..." },
    "en": { "description": "...", "lessons_learned": "..." },
    ... 全 7 言語
  }
}

ルール:
- description: 200 文字以内・「いつ・どこで・いくら・なぜ」を中立教育者風に説明
- lessons_learned: 100 文字以内・「同じ罠を避けるための教訓」
- 専門用語は ( ) で噛み砕き: 例 "リエントランシー攻撃 (関数が自分自身を再帰呼び出しできる脆弱性)"
- 投資推奨表現 / 「危険」表現 NG → 事実+学びの淡々とした記述
- "投資判断" / "売る" / "買う" 等の単語は避ける`;

interface Hack {
  id: string;
  protocol_name: string | null;
  date: string;
  amount_lost_usd: number | null;
  root_cause: string | null;
  translated_locales: string[];
}

async function translateHack(h: Hack): Promise<Record<string, { description: string; lessons_learned: string }> | null> {
  const userPrompt = `# Hack incident
Protocol: ${h.protocol_name ?? 'Unknown'}
Date: ${h.date}
Amount lost: $${((h.amount_lost_usd ?? 0) / 1e6).toFixed(1)}M
Root cause / technique: ${h.root_cause ?? 'unknown'}

Translate this hack incident into 7 languages (ja/en/th/vi/id/zh-TW/ko) using the educator tone.`;

  try {
    const result = await callOptimizedJson<{ translations: Record<string, { description: string; lessons_learned: string }> }>({
      promptId: 'tier_eval', // 既存 registry の system prompt で代用 (新規 hack-translation registry は将来追加)
      userPrompt: HACK_TRANSLATION_PROMPT + '\n\n' + userPrompt,
      temperature: 0.2,
      maxTokens: 2000,
    });
    return result.content.translations;
  } catch (e) {
    console.warn('[translate:hacks] LLM call failed', h.protocol_name, e instanceof Error ? e.message : e);
    return null;
  }
}

async function main() {
  const supabase = createServiceSupabase();
  // 未翻訳の hack を取得 (translated_locales が空 or ja を含まないもの)
  const { data: hacks } = await supabase
    .from('hacks')
    .select('id, protocol_name, date, amount_lost_usd, root_cause, technique, description, translated_locales')
    .order('date', { ascending: false })
    .limit(100);

  if (!hacks?.length) {
    console.log('[translate:hacks] no hacks to translate');
    return;
  }
  console.log(`[translate:hacks] processing ${hacks.length} hacks`);

  let success = 0;
  for (const h of hacks as Hack[]) {
    if (h.translated_locales?.includes('ja')) continue; // 既に翻訳済はスキップ

    const translations = await translateHack(h);
    if (!translations) continue;

    // description jsonb に全 7 言語を materialize
    const descJsonb: Record<string, string> = {};
    for (const locale of TARGET_LOCALES) {
      const t = translations[locale];
      if (t?.description) descJsonb[locale] = t.description;
    }

    await supabase
      .from('hacks')
      .update({
        description: descJsonb,
        lessons_learned_ja: translations.ja?.lessons_learned ?? null,
        lessons_learned_en: translations.en?.lessons_learned ?? null,
        translated_locales: TARGET_LOCALES.slice() as unknown as string[],
      })
      .eq('id', h.id);

    success++;
    if (success % 10 === 0) console.log(`[translate:hacks] ${success}/${hacks.length}`);
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`[translate:hacks] done · ${success} hacks translated to 7 languages`);
}

main().catch((err) => {
  console.error('[translate:hacks] fatal', err);
  process.exit(1);
});
