# Template / Horizontal Expansion Guide

> Cointier を起点に、同じアーキテクチャを **stocktier.ai (株式)** / **nfttier.ai (NFT)** /
> その他ジャンルへ横展開するためのガイド。

## 🎯 横展開戦略 (RR ルール準拠)

Cointier は単独サービスではなく **Asset Tier Intelligence Platform** の最初の実装。
同じ「Tier 6 軸評価 × アジア多言語 × Pattern B 個人投資家」フレームを、データソースだけ差し替えて別ジャンルに展開できる。

### 想定展開先 (優先度順)

| ドメイン | ジャンル | データソース差替 | 想定 TAM |
|---------|---------|-----------------|---------|
| `cointier.ai` ✅ | 暗号資産 (37K) | CoinGecko / DeFiLlama / CryptoRank / RootData | **本実装** |
| `stocktier.ai` | 株式 (10K) | yfinance / Polygon / Alpha Vantage / EDGAR | $XB |
| `nfttier.ai` | NFT collections (50K) | OpenSea / Magic Eden / NFTGo / SimpleHash | $XB |
| `startuptier.ai` | スタートアップ | Crunchbase / PitchBook / RootData | $XB |
| `tokentier.ai` | RWA / Real Estate Tokens | Securitize / RealT / 各国不動産 DB | $XB |

## 🛠️ Template 化の 3 アプローチ

### Approach 1: Template Repo (推奨・即着手可能)

```bash
# 1. 本リポを GitHub Template として公開
gh repo edit Paradigmllc/Cointierai --template

# 2. 別ジャンルで新規リポを作成
gh repo create Paradigmllc/Stocktierai --template Paradigmllc/Cointierai --private

# 3. brand.config.ts と src/lib/api/* を差し替えれば 80% 流用可
```

**メリット**: 即着手・全機能セット流用
**デメリット**: コード重複・bug fix を各 repo に手動反映が必要

### Approach 2: npm Package 抽出 (中期・パターン安定後)

5 つの npm package に分解:

```
@paradigmllc/
  ├─ pseo-engine        # sitemap / robots / hreflang / OG image 生成
  ├─ llm-openrouter     # OpenRouter wrapper + cache 最適化
  ├─ tier-evaluator     # 6 軸スコアリング (weights configurable)
  ├─ pseo-jsonld        # Schema.org helpers (FAQ / Article / ItemList / FinancialProduct)
  └─ crypto-data-clients # CoinGecko / DeFiLlama / CryptoRank 等の client 集
```

**メリット**: bug fix を 1 箇所で対応・新 PJ は npm install で済む
**デメリット**: パッケージ間の version 管理・依存解決が複雑

### Approach 3: Hybrid Monorepo (長期・5+ PJ ある段階)

```
paradigm-monorepo/
  ├─ apps/
  │  ├─ cointier/
  │  ├─ stocktier/
  │  └─ nfttier/
  └─ packages/
     ├─ pseo-engine/
     ├─ llm-openrouter/
     ├─ tier-evaluator/
     └─ ...
```

`turbo` / `pnpm workspaces` で管理。新 PJ 追加コストが極小化。

## 📋 Approach 1 実行手順 (今すぐ着手可能)

### 1. GitHub Template 化
```bash
gh repo edit Paradigmllc/Cointierai --template
```

### 2. 新規 PJ scaffold
```bash
gh repo create Paradigmllc/Stocktierai --template Paradigmllc/Cointierai --private
git clone https://github.com/Paradigmllc/Stocktierai
```

### 3. brand.config.ts を編集
```typescript
export const BRAND = {
  name: 'Stocktier',
  domain: 'stocktier.ai',
  industry: 'stocks',
  expectedAssetCount: 10_000,
  tagline: { ja: 'アジア発 AI 株式分析', en: "Asia's AI Stock Intelligence" },
  // ... 他は同じ構造で値だけ差替
};
```

### 4. データソース差替 (`src/lib/api/*` を新規 client に置換)
- `coingecko.ts` → `yfinance.ts` / `polygon.ts`
- `defillama.ts` → `edgar.ts` (SEC filings)
- `cryptorank.ts` → `pitchbook.ts` (削除 or 置換)

### 5. Supabase schema 調整 (`supabase/migrations/00001_init.sql`)
- `coins` テーブル → `stocks` テーブル (rename + 列追加: P/E, dividend yield 等)
- 他テーブルは流用可能 (vc_funds → institutional_investors にリネーム)

### 6. i18n メッセージ調整 (`src/messages/*.json`)
- "暗号資産" → "株式"
- "VC 投資" → "機関投資家"
- 他は流用可

### 7. Tier 評価軸の調整 (`brand.config.ts`)
株式の場合、Pattern B から少し調整:
```typescript
tierWeights: {
  liquidity: 0.20,    // 株式は流動性が機関投資家の前提
  team: 0.15,         // 経営陣
  technology: 0.10,   // moat (株式ではこの軸の意味が弱まる)
  community: 0.10,    // SNS 銘柄人気
  regulatory: 0.20,   // 上場ルール準拠
  future: 0.25,       // 成長性
},
```

## 🚀 共通モート (どの PJ にも引き継がれる)

これらは PJ 間で **共有資産** となるため、横展開ごとに強化される:

1. **アジア多言語 pSEO エンジン** — 7 言語 × ロングテール量産
2. **DeepSeek V4 Cache 最適化** — どのジャンルでも cache hit 80%+ で運用コスト極小
3. **CryptoRank.io 風 UI** — クリプト由来のダークテーマ高密度テーブルは他ジャンルでも視認性◯
4. **Tier 評価 6 軸フレーム** — 軸の意味を業界別に再定義するだけで流用可能
5. **OpenRouter ゲートウェイ統一** — 1 OPENROUTER_API_KEY で全 PJ 動作

## 📊 npm Package 抽出ロードマップ (Approach 2)

### Phase 1: pseo-engine (最初に抽出)
- `src/lib/seo/jsonld.ts` → package
- `src/app/sitemap*.ts` のロジック → package
- `src/app/robots.ts` → package
- 想定 weekly DL: 100-1,000 (paradigm 内部利用 + OSS 公開)

### Phase 2: llm-openrouter
- `src/lib/llm/openrouter.ts` → package
- `src/lib/llm/cache-optimizer.ts` → package
- `scripts/cache-report.ts` → CLI 化
- OpenRouter cache 最適化は他で需要が高い (Anthropic / OpenAI ユーザーも欲しがる)

### Phase 3: tier-evaluator
- `src/lib/tier-evaluation/score.ts` → package
- weights を generic 化 (`crypto-weights.json` / `stock-weights.json` 等)
- npm: `@paradigmllc/tier-evaluator`

### Phase 4: crypto-data-clients (crypto 特化)
- `src/lib/api/*` → package (crypto 専用のため stock 系には不要)
- 並列で stock-data-clients も作成

## 📚 横展開 PJ で再利用するファイル一覧

| ファイル | 流用度 | 改修量 |
|---------|-------|--------|
| `src/i18n/*` | 100% | 0 |
| `src/middleware.ts` | 100% | 0 |
| `src/messages/*.json` | 50% | i18n の値置換 |
| `src/components/ui/*` | 100% | 0 |
| `src/components/layout/*` | 90% | ロゴ・タグライン |
| `src/components/tables/CoinsTable.tsx` | 80% | カラム調整 |
| `src/components/coin/TierBadge.tsx` | 100% | 0 |
| `src/lib/seo/*` | 100% | 0 |
| `src/lib/llm/*` | 100% | 0 |
| `src/lib/tier-evaluation/*` | 70% | weights 調整・prompt 文体 |
| `src/lib/db/*` | 95% | schema 調整 |
| `src/lib/api/*` | 0-100% | データソース全差替 |
| `supabase/migrations/*` | 70% | テーブル名・列調整 |
| `scripts/*` | 50-80% | ingestion logic 業界別 |
| `tailwind.config.ts` | 100% | 0 |
| `next.config.mjs` | 95% | image domains 差替 |

> **流用率の重み付き平均: 約 75%**
> 新ジャンル PJ の開発工数は本実装の **25-30%** で完成する想定。
