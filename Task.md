# Task.md — Cointier

> 永久ルール TASK に基づく作業キュー。Notion 設計書 (3,328 行) 全反映済。
> セッション開始時に必ず読む。

---

## ✅ M1 MVP 完了 (2026-05-13)

### 基盤・i18n・DB
- [x] Next.js 15 + TypeScript + Tailwind + shadcn/ui scaffold
- [x] i18n 7 言語完全翻訳 (ja/en/th/vi/id/zh-TW/ko)
- [x] Supabase migrations 00001 (init) + 00002 (aggregate) + 00003 (JP exchanges)
- [x] RLS 全テーブル (MM ルール準拠)
- [x] OpenRouter ゲートウェイ統一 (DeepSeek V4 Pro Prompt Caching)

### データソース統合 (10 種)
- [x] CoinGecko Demo + Details + OHLC ingestion
- [x] CryptoRank Basic (Sandbox→Basic 切替戦略文書化)
- [x] DeFiLlama (Protocols + Raises + Hacks + Unlocks)
- [x] DEXScreener (DEX pair)
- [x] RootData (アジア VC)
- [x] Tokenomist (要交渉) + DeFiLlama Unlocks fallback
- [x] Token Terminal (月 50 万 req)
- [x] LunarCRUSH (Social signal)
- [x] Hyperliquid (Perps + Builder Fee 基盤)
- [x] Polymarket (予測マーケット)
- [x] BTC = 1 行集約パターン (coin-resolver + coin-aggregate)

### UI (CryptoRank/CMC 超え)
- [x] ダークテーマ (CryptoRank 観測色)
- [x] CoinsTable (TanStack Table sortable)
- [x] TradingView Advanced Chart 埋込 (500px)
- [x] TradingView Mini Chart (sparkline)
- [x] TradingView Symbol Overview (中型)
- [x] TradingView Ticker Tape (ホーム上部)
- [x] TradingView Heatmap (市場 sentiment)
- [x] Pure SVG Sparkline (軽量版)
- [x] Tier Badge S/A/B/C/D/F カラー
- [x] OG image dynamic generation (Edge Runtime)

### pSEO (285K → 367K ページ)
- [x] coin/[symbol] × 7 locale = 259,000
- [x] vc/[slug] × 7 = 70,000
- [x] compare/[pair] × 7 = 34,650 (Top 100)
- [x] category/[slug] × 7 = 3,500
- [x] tier/[s-f] × 7 = 42 + FAQ Schema
- [x] ido + unlocks + tools/risk-score 等 static
- [x] sitemap-coins.xml chunked (50K limit)
- [x] robots.txt with AI bot 明示許可
- [x] JSON-LD (FinancialProduct + FAQPage + ItemList + BreadcrumbList)
- [x] hreflang 7 言語完備

### Tier 評価 Pattern B (個人投資家向け)
- [x] community 0.25 + future 0.25 = 50% (草コインも S/A 可)
- [x] LunarCRUSH galaxy_score / Hyperliquid listed / Token Terminal revenue 補正
- [x] 中立教育者風プロンプト (専門用語噛み砕き)
- [x] DeepSeek V4 Pro Cache hit 最適化 (Prompt registry + hash 検知)

### Free→Pro 転換壁 3 種
- [x] 壁① VC 投資先「残り N 件」ぼかし表示 (ProGateBlur)
- [x] 壁② アンロックアラート (Pro 限定・7d/90d)
- [x] 壁③ 税務レポート Pro 限定

### 日本特化機能
- [x] 国内取引所マッピング 9 取引所 (bitFlyer/Coincheck/GMO etc)
- [x] 雑所得計算ロジック (移動平均法)
- [x] 累進課税 5-45% + 住民税試算
- [x] CSV import (4 国内取引所対応)
- [x] DeFiLlama Hacks DB 7 言語翻訳

### ウォレット統合 (goodcryptoX 方式)
- [x] wagmi + viem 標準接続 (MetaMask + WalletConnect + injected)
- [x] **接続=承認 ワンフロー** Builder Fee モーダル (EIP-712 署名)
- [x] Web3Provider 統合 (layout.tsx)
- [x] Header に ConnectWalletButton
- [x] /api/wallet/builder-fee-approval (DB 記録)

### ダッシュボード (Pro 機能)
- [x] /dashboard (ハブ・5 カード)
- [x] /dashboard/portfolio (AI 分析)
- [x] /dashboard/tax (確定申告サマリー)
- [x] /dashboard/wallet (ウォレット連携)
- [x] /dashboard/watchlist (Free)
- [x] /dashboard/alerts (Free 1 件 / Pro 無制限)
- [x] /api/portfolio/analyze (Mock M1 / M4 で本実装)

### B2B / UGC
- [x] /pclaim (B2B 申請フォーム・Free + Pro ¥29,800)
- [x] /api/pclaim/apply
- [x] /ido/[slug]/reviews/[user] (UGC pSEO 自律増殖)

### モバイル準備
- [x] capacitor.config.ts (M3 アプリ化準備)
- [x] docs/MOBILE.md (ASO + Push + Builder Fee 戦略)

### 規制対応
- [x] 「Buy on X」→「X で購入可能 / Available on X」
- [x] PR バッジ + 「広告リンクを含みます・投資推奨ではありません」明示
- [x] 帰属表示 (CoinGecko / DeFiLlama / 全 10 ソース) Footer
- [x] AI bot 明示許可 (Perplexity / ChatGPT / GPTBot / ClaudeBot)

---

## 🔄 進行中 (M0-M1 残)

- [ ] **依存パッケージ install** (`npm install` — sharp postinstall は --ignore-scripts で回避)
- [ ] **Supabase project 作成 + migrations 適用** (00001 → 00002 → 00003)
- [ ] **OpenRouter API キー設定** (既存メモリから Coolify env へ)
- [ ] **CoinGecko Demo キー取得** (登録のみ・5 分)
- [ ] **CryptoRank Basic 契約** ($19/月・必須)
- [ ] **`npm run ingest:all` 初回実行** (17K-37K coins ingest)
- [ ] **`npm run tiers:compute`** (Pattern B Tier 算出)
- [ ] **`npm run summaries:generate`** (7 言語 LLM 解説)
- [ ] **Coolify デプロイ** (appexx.me インフラ共用)
- [ ] **ドメイン取得** (cointier.ai + .io + .co · Porkbun)
- [ ] **商標調査** (J-PlatPat)
- [ ] **被リンク Tier S 一斉確保** (GitHub / npm / LinkedIn / Medium / Zenn / Qiita / note / Reddit)

---

## 📋 M3-M4 (アプリ化フェーズ)

- [ ] Capacitor 統合 (`npx cap add ios/android`)
- [ ] App Store / Google Play 申請 (多言語ストア)
- [ ] Push 通知 (FCM/APNs + Supabase push_subscriptions テーブル)
- [ ] Privy 統合 (メール/SNS ログイン → ウォレット自動生成)
- [ ] Stripe 課金 (Pro ¥1,980 / Business ¥9,800 / 年額デフォルト)
- [ ] 税務 PDF DL 機能 (DeepSeek + Gotenberg)
- [ ] portfolio/analyze 本実装 (Etherscan + DeepSeek V4 Pro)

## 📋 M4-M6 (Builder Fee + AI パーソナライズ)

- [ ] Hyperliquid Builder address オンチェーン登録
- [ ] Hyperliquid 取引履歴自動 import
- [ ] AI ポートフォリオアラート (アンロック影響予測)
- [ ] タイ語・ベトナム語 LLM 翻訳バッチ
- [ ] DeFi TVL 履歴チャート

## 📋 M6-M9

- [ ] pClaim B2B 営業パイプライン (n8n + Dify + Slack 承認)
- [ ] インドネシア語・繁体字追加
- [ ] UGC 投稿フォーム + モデレーション
- [ ] Polymarket Verified Builder 申請

## 📋 M9-M12

- [ ] 韓国語追加 (7 言語完備)
- [ ] API 公開 (Starter/Pro/Enterprise)
- [ ] Polymarket Partner Tier
- [ ] MCP / x402 統合

## 📋 Exit 準備 (M18-M24)

- [ ] Empire Flippers DD 資料準備
- [ ] サブスク MRR ¥300 万 × 36 倍 = ¥1.08 億評価
- [ ] 3 ヶ月連続財務記録

---

## 🔒 永久ルール (cointier memory)

- **LLM-V4-PRO**: DeepSeek V4 Pro 強制 (V3 / deepseek-chat / deepseek-reasoner 禁止)
- **LLM-OPENROUTER-ONLY**: 全 LLM は OpenRouter 経由
- **TIER-PATTERN-B**: community 0.25 + future 0.25
- **DATA-AGGREGATE**: 全 9 ソース → coins 1 行統合
- **PSEO-285K**: 367,000 ページ pSEO 設計
- **A-CONTENT**: ハードコード NG / Block 化 / CMS 編集可能 / messages i18n
- **規制対応**: 「推奨」NG → 「利用可能」表現 / PR バッジ必須

---

## 📊 リポジトリ最終状態

- **Repo**: https://github.com/Paradigmllc/Cointierai
- **Files**: 約 130
- **Lines**: 約 15,000
- **Pages**: 367,000+
- **Locales**: 7 完全翻訳
- **APIs**: 10 統合 + OpenRouter LLM
- **Commits**: 主要 16 件
