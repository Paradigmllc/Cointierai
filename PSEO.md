# pSEO Architecture Documentation

> Cointier の 285,000 ページ pSEO アーキテクチャ。
> SS ルール (第3の強み) の中核実装。

## 📊 ページ総量

| ページタイプ | URL pattern | 件数 | × 7 locale | 合計 |
|------------|------------|------|-----------|------|
| Coin detail | `/[locale]/coin/[symbol]` | 37,000 | × 7 | **259,000** |
| VC profile | `/[locale]/vc/[slug]` | 10,000 | × 7 | **70,000** |
| Category | `/[locale]/category/[slug]` | 500 | × 7 | 3,500 |
| Tier ranking | `/[locale]/tier/[s-f]` | 6 | × 7 | 42 |
| Compare pair | `/[locale]/compare/[a-vs-b]` | Top 100×99/2 = 4,950 | × 7 | **34,650** |
| Chain | `/[locale]/chain/[id]` | 50 | × 7 | 350 |
| Static | `/`, `/coins`, `/tools/*` etc | 15 | × 7 | 105 |
| **合計** | | | | **約 367,000** |

> 285K → 367K に拡張可能（compare 組み合わせ追加）。
> compare を Top 1000 で組めば 約 500K 組 × 7 = 3.5M ページ (Phase 2)

## 🛠️ 実装スタック

### Sitemap 分割 (Google 50K/file 上限対応)

```
/sitemap.xml             ← 静的 + tier ranking (~100 URLs)
/sitemap-coins.xml       ← coin × locale (chunk 単位で paginate)
/sitemap-vcs.xml         ← VC × locale
/sitemap-categories.xml  ← category × locale
```

`/sitemap-coins.xml?chunk=0` → URL 0-39,999
`/sitemap-coins.xml?chunk=1` → URL 40,000-79,999
…

実装: `src/app/sitemap*.{ts,xml}` (Next.js 15 native routing)

### hreflang 多言語 SEO

全 pSEO ページの `<head>` に:
```html
<link rel="alternate" hreflang="ja"     href="https://cointier.ai/ja/coin/bitcoin" />
<link rel="alternate" hreflang="en"     href="https://cointier.ai/en/coin/bitcoin" />
<link rel="alternate" hreflang="th"     href="https://cointier.ai/th/coin/bitcoin" />
<link rel="alternate" hreflang="vi"     href="https://cointier.ai/vi/coin/bitcoin" />
<link rel="alternate" hreflang="id"     href="https://cointier.ai/id/coin/bitcoin" />
<link rel="alternate" hreflang="zh-TW"  href="https://cointier.ai/zh-TW/coin/bitcoin" />
<link rel="alternate" hreflang="ko"     href="https://cointier.ai/ko/coin/bitcoin" />
```

実装: `generateMetadata().alternates.languages` で自動生成

### Schema.org JSON-LD (GEO 最強)

各ページタイプ別に最適な Schema を埋め込み:

| ページ | 主要 Schema |
|--------|------------|
| Coin detail | `FinancialProduct` + `AggregateRating` + `BreadcrumbList` |
| Tier ranking | `ItemList` + `FAQPage` + `BreadcrumbList` |
| Category | `Article` + `ItemList` + `BreadcrumbList` |
| VC profile | `Article` + `Organization` + `BreadcrumbList` |
| Compare | `Article` + `BreadcrumbList` |
| Home | `Organization` + `WebSite` + `SearchAction` |

Perplexity / ChatGPT / Gemini の引用判断に直接効く。

実装: `src/lib/seo/jsonld.ts`

### Dynamic OG Image (バイラル設計)

`/api/og/coin/[symbol]` → Edge Runtime で 1200×630 PNG 生成
- 銘柄名・Tier Badge (S=金 / A=銀 …)・価格・24h 変化
- X / LINE / Telegram シェアで自動展開
- 「自分の保有銘柄は Tier S だった」とシェアしたくなる視覚設計

実装: `next/og` ImageResponse

### ISR (Incremental Static Regeneration)

```typescript
// すべてのページに revalidate 設定済
export const revalidate = 300;    // home: 5min
export const revalidate = 600;    // coin detail: 10min
export const revalidate = 1800;   // tier ranking: 30min
export const revalidate = 3600;   // category: 1hr
export const revalidate = 86_400; // VC / static SEO: 24hr
```

→ 285K ページが「ビルド済 + バックグラウンド再生成」で配信。
SSR コストゼロでスケール。

## 🤖 GEO (Generative Engine Optimization) 設計

Perplexity / ChatGPT / Gemini に **引用元として選ばれる**ための仕様:

1. **TL;DR 先出し** — 各ページ冒頭 (Cointier では各 tier ranking page に実装済)
2. **FAQ 構造** — `FAQPage` Schema + 実画面の `<details>` 要素 (Tier ranking で実装済)
3. **自社統計** — Pattern B 6 軸スコアという独自の数値指標 (他 API にない)
4. **外部シグナル** — Zenn / Qiita / Reddit / Medium 記事から逆リンク (M1 で対応)
5. **AI bot 許可** — `robots.txt` で `PerplexityBot` / `ChatGPT-User` / `GPTBot` / `ClaudeBot` を明示許可

## 🔥 DeepSeek Cache Hit 最適化

285K ページの LLM サマリー生成で **cache hit 率 80%+ を目標**。

### 4 大原則 (cache-optimizer.ts で構造的に強制)

1. **System prompt 不変** — SHA-256 hash で変更検知・週次バッチ以外の変更 NG
2. **Order 固定** — system → static context → dynamic user
3. **連続バッチ** — 並列ではなく直列実行 (cache hit 効率最大化)
4. **動的要素を system に入れない** — timestamp / random / user_id 等 厳禁

### コスト試算

仮に cache hit 率 80% で全 285K ページを 7 言語で生成すると:

```
1 ページあたり:
  prompt 600 tokens × $0.435/1M × (0.2 + 0.8 × 0.1) = $0.0000731
  output 200 tokens × $0.87/1M                       = $0.000174
  合計                                                ≒ $0.00025

285K × 1 言語 × $0.00025 = $71
× 7 言語                  = $499
```

→ **全 285K × 7 言語 LLM サマリー生成が $500 (¥75,000)**
   月次差分更新は数百円レベル。

検証: `scripts/cache-report.ts` で実測 cache hit 率を確認。

## 📈 段階的 pSEO ローンチ

### Phase 1: M1 (基盤)
- Top 1,000 coins × 7 言語 = 7,000 ページ生成・公開
- 全 tier ranking / category / 上位 50 VC profile
- 検索エンジン submit + Google Search Console 設定
- 被リンク Tier S 取得 (GitHub / npm / LinkedIn / Medium / Zenn / Qiita / note)

### Phase 2: M2 (拡張)
- 全 17,000 CoinGecko coins × 7 言語 = 119,000 ページ
- Top 100 coin × 99 pair compare = 34,650 ページ
- 自社 UGC 招集 (IDO 参加レポート投稿機能)

### Phase 3: M3 (完全展開)
- CryptoRank 全 37,000 coins × 7 言語 = 259,000 ページ
- 全 VC profile × 7 = 70,000 ページ
- Top 1,000 coins compare 組み合わせ = 数百万ページ
- 合計 約 367,000+ ページ

### Phase 4: M6+ (深化)
- 銘柄ごとの長文 LLM 解説 (現状 200 文字 → 2,000 文字)
- 各 unlock event 個別ページ
- ニュース連携 (LunarCRUSH + 公式 RSS)

## 🌐 npm Extraction Plan (横展開準備)

将来的に以下を `@paradigmllc/pseo-*` として独立 npm 化:

### `@paradigmllc/pseo-sitemap`
- 大規模サイトの sitemap 分割ロジック
- Google 50K/file 上限対応
- hreflang 自動生成
- ISR-friendly

### `@paradigmllc/pseo-jsonld`
- Schema.org helpers (FAQ / Article / ItemList / FinancialProduct / BreadcrumbList)
- AggregateRating ヘルパー
- AI bot 許可 robots.txt helper

### `@paradigmllc/llm-cache-optimizer`
- DeepSeek / Anthropic / OpenAI 共通 cache hit optimization
- Versioned prompt registry
- Hash-based change detection
- Batch executor

→ 詳細は `TEMPLATE.md` 参照。
