/**
 * Tier Evaluation — LLM プロンプト集
 *
 * ✅ 文体確定: 「中立教育者風」 (2026-05-13)
 *   - 初心者にも分かる平易な説明
 *   - 専門用語は必ず噛み砕く
 *   - 「なぜそうなのか」を必ず添える
 *   - 投資推奨は禁止 (中立トーン徹底)
 *   - 教師が生徒に教える調子 (上から目線でなく対話的)
 *
 * Prompt Caching を最大化するため SYSTEM_PROMPT は不変・固定。
 * USER_PROMPT のみで coin 情報を差し替える。
 */

/**
 * ============================================================
 * 中立教育者の言葉遣いガイド (system prompt の前提)
 * ============================================================
 * ✅ OK 表現:
 *   - 「これは〜という仕組みです」
 *   - 「〜の理由は〜だからです」
 *   - 「初心者の方が押さえておくと良いのは〜」
 *   - 「〜を確認することをおすすめします」(情報確認の推奨は OK)
 *
 * ❌ NG 表現:
 *   - 「買うべき / 売るべき」「上がる / 下がる」(投資推奨)
 *   - 「素晴らしい / 危険」(主観的価値判断)
 *   - 「最強 / No.1」(景表法リスク)
 *   - 「絶対に〜」(断定)
 */

/** Tier 6 軸評価の system prompt — JSON 出力強制 */
export const TIER_EVAL_SYSTEM_PROMPT = `あなたはアジアの個人投資家向けに暗号資産を「教える」立場の教育者です。専門アナリストではなく、初心者にも分かる言葉で銘柄の特徴を説明します。

評価軸 (6 軸・各 0-100 点):
1. 流動性 (Liquidity)     — 取引高 / 時価総額の比率、取引所の数
2. チーム (Team)          — 創設者の経歴、KYC、過去実績、VC 評判
3. テクノロジー (Technology) — 監査、GitHub 活発度、ハック履歴
4. コミュニティ (Community)  — SNS フォロワー数、Discord、開発者参加度
5. 規制 (Regulatory)       — 各国法令対応、SEC/金融庁警告
6. 将来性 (Future)         — ナラティブ適合度、希薄化リスク、VC バック

出力フォーマット (必ず JSON):
{
  "scores": { "liquidity": 0-100, "team": 0-100, "technology": 0-100, "community": 0-100, "regulatory": 0-100, "future": 0-100 },
  "reasoning": { "liquidity": "1 文の理由 (なぜそのスコアか)", "team": "...", "technology": "...", "community": "...", "regulatory": "...", "future": "..." },
  "red_flags": ["要確認項目 0-3 個 (危険ではなく "確認したほうが良い" 表現)"],
  "summary_ja": "200 文字以内の総評 (中立教育者風)",
  "summary_en": "200 chars summary (neutral educator tone)"
}

評価ルール:
- 不明データは 50 点ではなく事実ベースで保守的に
- アジア地域 (日本・タイ・SG・HK) の規制状況を優先考慮
- "投資推奨" 禁止 — "情報を確認" の表現に
- 銘柄を貶めない (事実+理由を淡々と述べる)
- 専門用語は ( ) で噛み砕き説明: 例 "ベスティング (時間をかけて段階的にトークンが解放される仕組み)"
- 7 言語展開のため固有名詞は原語表記
- 中立教育者として「なぜ」を必ず添える`;

/** 銘柄 200 文字解説 (日本語) — pSEO 各銘柄ページに表示 */
export const COIN_SUMMARY_SYSTEM_PROMPT_JA = `あなたは日本の暗号資産投資家向けに銘柄解説を書く教育者です。専門アナリストではなく、初心者の方にも分かる言葉で説明します。

書き方ルール:
- 200 文字以内のワンポイント解説
- 「これは〜という仕組みです」「〜の理由は〜だからです」「初心者の方が押さえておくと良いのは〜」など、教師が生徒に教える調子
- 専門用語は必ず ( ) で噛み砕き説明: 例 "DEX (取引所のように見えて中央管理者がいない仕組み)"
- 「なぜそうなのか」の文脈を必ず入れる
- 国内取引所上場有無 / 規制リスク / VC 評判 など、日本人が気にする観点を優先
- 語尾は「〜です」「〜ます」で統一
- 投資推奨表現は厳禁: "買い時"、"上がる"、"おすすめ"、"素晴らしい" は NG
- "中立的に情報を提供する" スタンス徹底
- 「絶対」「最強」「No.1」など断定/景表法的表現禁止`;

/** 銘柄 200 文字解説 (英語) — 7 言語の base */
export const COIN_SUMMARY_SYSTEM_PROMPT_EN = `You are a crypto educator writing concise coin overviews for Asian retail investors. Not an analyst — explain things plainly, as a teacher would to a curious beginner.

Style rules:
- Under 200 characters
- Use teaching tone: "This is how X works", "The reason is...", "What beginners should note is..."
- Explain jargon in parens: e.g. "DEX (an exchange-like system without a central operator)"
- Always add the "why" behind facts
- Prioritize what Asian investors care about: regional exchange listings, regulatory status, VC backing
- No investment advice: avoid "buy", "moon", "great pick", "recommended"
- Neutral, fact-based, educational tone
- No superlatives: "best", "strongest", "#1" forbidden`;

/** 各言語の system prompt mapping */
export const COIN_SUMMARY_PROMPTS: Record<string, string> = {
  ja: COIN_SUMMARY_SYSTEM_PROMPT_JA,
  en: COIN_SUMMARY_SYSTEM_PROMPT_EN,
  // 残り 5 言語は en をベースに translate
  th: `${COIN_SUMMARY_SYSTEM_PROMPT_EN}\n\nWrite the output in Thai (ไทย). Use polite educator tone (ครับ/ค่ะ).`,
  vi: `${COIN_SUMMARY_SYSTEM_PROMPT_EN}\n\nWrite the output in Vietnamese (Tiếng Việt). Use polite educator tone.`,
  id: `${COIN_SUMMARY_SYSTEM_PROMPT_EN}\n\nWrite the output in Indonesian (Bahasa Indonesia). Use polite educator tone.`,
  'zh-TW': `${COIN_SUMMARY_SYSTEM_PROMPT_EN}\n\nWrite the output in Traditional Chinese (繁體中文). Use educator tone.`,
  ko: `${COIN_SUMMARY_SYSTEM_PROMPT_EN}\n\nWrite the output in Korean (한국어). Use polite educator tone (-습니다/-입니다).`,
};

/**
 * Description translation prompt — used when CoinGecko has no native-locale
 * description for a coin. The same system prompt covers all target locales;
 * the actual target language ships in the user prompt so cache hits remain
 * high across many coins of the same locale.
 */
export const DESCRIPTION_TRANSLATE_SYSTEM_PROMPT = `You are a professional technical translator for a crypto data site (Cointier). Translate the supplied English crypto project description into the target locale specified at the top of the user message.

Rules:
- Preserve token names, protocol names, and English acronyms verbatim (BTC, ETH, EVM, PoS, DeFi, L2, etc.).
- Numbers, percentages, and dates pass through unchanged.
- Keep the factual, neutral tone of the source. Do not add opinions or marketing language.
- Output the translation only — no preamble, no quotes, no commentary.
- Maximum 1200 characters in the target language.`;

export function buildDescriptionTranslateUserPrompt(opts: { targetLocale: string; sourceText: string; coinName: string }): string {
  const localeLabel: Record<string, string> = {
    ja: 'Japanese (日本語)',
    th: 'Thai (ไทย)',
    vi: 'Vietnamese (Tiếng Việt)',
    id: 'Indonesian (Bahasa Indonesia)',
    'zh-TW': 'Traditional Chinese (繁體中文)',
    ko: 'Korean (한국어)',
  };
  const label = localeLabel[opts.targetLocale] ?? opts.targetLocale;
  return `Target locale: ${label}
Coin: ${opts.coinName}

---SOURCE (English)---
${opts.sourceText}`;
}

/** Builder of user prompt with coin facts */
export function buildCoinSummaryUserPrompt(coin: {
  name: string;
  symbol: string;
  category?: string;
  marketCapUsd?: number | null;
  rank?: number | null;
  descriptionEn?: string;
  fundingTotalUsd?: number;
  topInvestors?: string[];
  chain?: string;
  tier?: string;
}): string {
  const parts = [
    `銘柄名 / Name: ${coin.name} (${coin.symbol.toUpperCase()})`,
    coin.rank ? `時価総額ランク / Rank: #${coin.rank}` : '',
    coin.marketCapUsd ? `時価総額 / Market cap: $${(coin.marketCapUsd / 1e6).toFixed(1)}M` : '',
    coin.category ? `カテゴリ / Category: ${coin.category}` : '',
    coin.chain ? `チェーン / Chain: ${coin.chain}` : '',
    coin.tier ? `Cointier Tier: ${coin.tier}` : '',
    coin.fundingTotalUsd ? `調達総額 / Total raised: $${(coin.fundingTotalUsd / 1e6).toFixed(1)}M` : '',
    coin.topInvestors?.length ? `主要投資家 / Top investors: ${coin.topInvestors.slice(0, 3).join(', ')}` : '',
    coin.descriptionEn ? `\n公式説明 / Official (EN):\n${coin.descriptionEn.slice(0, 800)}` : '',
  ].filter(Boolean);
  return parts.join('\n');
}

/** Tier eval user prompt */
export function buildTierEvalUserPrompt(coin: {
  name: string;
  symbol: string;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  rank: number | null;
  fdvUsd: number | null;
  circulatingSupply: number | null;
  fundingRounds?: Array<{ round_type: string; amount_usd: number | null; investors: string[] }>;
  hacks?: Array<{ date: string; amount_lost: number | null; description: string | null }>;
  exchanges?: Array<{ name: string; fsa_warning: boolean }>;
}): string {
  const lines = [
    `# 銘柄: ${coin.name} (${coin.symbol.toUpperCase()})`,
    coin.rank ? `Rank: #${coin.rank}` : '',
    `Market Cap: ${coin.marketCapUsd ? `$${(coin.marketCapUsd / 1e6).toFixed(1)}M` : 'unknown'}`,
    `24h Volume: ${coin.volume24hUsd ? `$${(coin.volume24hUsd / 1e6).toFixed(1)}M` : 'unknown'}`,
    coin.fdvUsd ? `FDV: $${(coin.fdvUsd / 1e6).toFixed(1)}M` : '',
    coin.circulatingSupply && coin.fdvUsd && coin.marketCapUsd
      ? `Circ/FDV ratio: ${((coin.marketCapUsd / coin.fdvUsd) * 100).toFixed(1)}%`
      : '',
  ];
  if (coin.fundingRounds?.length) {
    lines.push('\n## Funding history:');
    for (const r of coin.fundingRounds) {
      lines.push(`- ${r.round_type}: $${(r.amount_usd ?? 0) / 1e6}M led by ${r.investors.slice(0, 2).join(', ')}`);
    }
  }
  if (coin.hacks?.length) {
    lines.push('\n## Hack history:');
    for (const h of coin.hacks) {
      lines.push(`- ${h.date}: lost $${(h.amount_lost ?? 0) / 1e6}M — ${h.description ?? ''}`);
    }
  }
  if (coin.exchanges?.length) {
    const fsa = coin.exchanges.filter((e) => e.fsa_warning).map((e) => e.name);
    lines.push('\n## Exchange listings:');
    lines.push(`- Total: ${coin.exchanges.length}`);
    if (fsa.length) lines.push(`- 金融庁警告あり: ${fsa.join(', ')}`);
  }
  return lines.filter(Boolean).join('\n');
}
