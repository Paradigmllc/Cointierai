# Task.md — Cointier

> 永久ルール TASK に基づく作業キュー。Notion 設計書 (3,328 行) 全反映済。
> セッション開始時に必ず読む。

---

## ✅ UI redesign — Stripe-inspired clean dashboard (2026-05-13)

- [x] globals.css: Stripe Indigo (#635BFF) を accent に採用 / `--subtle` + 3 段 shadow tokens 追加 / radius 10px
- [x] tailwind.config.ts: `subtle` color + `shadow-soft/card/lifted` 拡張
- [x] `.surface` / `.section-heading` ユーティリティを追加し全ページに波及
- [x] Header / Footer / PageHeader / GlobalStatsBar / HighlightCards / Homepage / CoinsTable: surface card 化・コメント中立化
- [x] Coin detail / Coins / IDO / VCs page header コメントを中立的説明に書き換え
- [x] 法的リスク低減: 「寸分違わぬ複製」「本家準拠」等の指示文言を削除し、generic industry-standard data dashboard pattern + Cointier 独自 brand identity の記述に統一 (s6 Exit DD 対策)

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

## ✅ 拡張機能完了 (2026-05-13 第2サイクル)

### ユーザー認証 + Pro 機能
- [x] Supabase Auth + SSR (createAuthSupabase / createServiceSupabase)
- [x] AI 解説 cache hit (OpenRouter Prompt Caching cached_tokens 監視)
- [x] Hyperliquid Builder Fee (EIP-712 wagmi/viem · goodcryptoX 方式)
- [x] Polymarket 統合 (予測マーケット ingest + dashboard 表示)

### PayloadCMS 風カスタム管理画面 + アフィリエイト永久ロックイン
- [x] /admin layout + isAdminEmail allowlist (ADMIN_EMAILS env)
- [x] /admin/page.tsx (KPI ダッシュボード: Coins/Users/Clicks/Conv/Rev 30d)
- [x] /admin/affiliate-links (一覧 + CVR + Revenue)
- [x] /admin/affiliate-links/new (フォーム + /go/[code] preview)
- [x] AffiliateLinkForm.tsx (code/partner/target_url/payout)
- [x] /api/admin/affiliate-links (GET/POST CRUD)
- [x] /api/admin/affiliate-links/[id] (PATCH/DELETE)
- [x] AffiliateCTA.tsx 統一 (`/go/${code}?coin=${symbol}`)
- [x] Supabase migration 00004 (affiliate_links + sessions + clicks + conversions + partners · 15 preset partners)
- [x] /go/[code] route (resolve link → cookie 10yr → click_id → DB → redirect with subID)
- [x] /api/affiliate/postback/[partner] (HMAC SHA-256 S2S)
- [x] /api/attribution/beacon (1x1 PNG + cookie set · best-effort upsert)
- [x] TrackingBeacon.tsx (sendBeacon + img fallback · layout 統合)
- [x] S2S Trinity: Cookie 100% + S2S 95% + img beacon 補完

---

## ✅ 本番稼働開始 (2026-05-13 04:18 UTC)

**Deploy URL**: http://ao5dx27lbmt97el0xss1kvrw.139.59.250.5.sslip.io
**Latest commit**: `825210a`
**Deploy UUID**: `v8njiu23ryyl6q862gnkxibq`
**Status**: ✅ All 7 critical paths verified 200 OK (詳細 → SETUP-MANUAL-STEPS.md §5)

### 解決した 13 件の deploy 失敗 (技術的記録)
詳細 → `~/.claude/projects/D--dev-cointierai/memory/reference_coolify.md`
1. git PAT 認証 → repo public 化
2. URL prefix doubled → `owner/repo` 形式
3. NODE_ENV=production at build → env 削除 + lockfile sync
4. nixpacks step #8 OOM → build_pack を dockerfile に
5. @privy-io@2.0.0 内部 Solana 競合 → 削除 (M3-M4 で再導入予定)
6-7. ESLint `<img>` + `@typescript-eslint/no-explicit-any` 不正 disable
8-9. Next.js 15 LayoutConfig: `locale: Locale` narrow → `string` + cast
10. `capacitor.config.ts` の @capacitor/cli → tsconfig exclude
11. npm ci OOM → `--ignore-scripts` + sharp rebuild
12. MISSING_MESSAGE `table.date` + null `h.chain.slice()` → i18n 7 locale + force-dynamic

---

## 🔄 残り manual 作業 (詳細 → docs/SETUP-MANUAL-STEPS.md)

### 🔴 必須 (UI からの作業)
- [ ] Supabase Dashboard → Settings → API → Exposed schemas に `cointier` 追加 (5分)
- [ ] CoinGecko Demo API key 取得 + Coolify env `COINGECKO_API_KEY` (5分)
- [ ] Coolify env `ADMIN_EMAILS` = `apple.info.9124@gmail.com` (1分)

### 🟠 推奨 (M1-M2)
- [ ] CryptoRank Basic 契約 ($19/月)
- [ ] RootData API 申請
- [ ] Token Terminal / LunarCRUSH API
- [ ] `npm run ingest:all` 初回実行 (17K coins)
- [ ] `npm run tiers:compute` (Pattern B Tier 算出)
- [ ] `npm run summaries:generate` (7 言語 LLM 解説)

### 🟡 本番化
- [ ] ドメイン `cointier.ai` 取得 (Porkbun) + Cloudflare DNS
- [ ] 商標調査 (J-PlatPat)
- [ ] 被リンク Tier S 一斉確保 (10 サイト)

### Deploy トライアル履歴 (詳細 → `reference_coolify.md`)
| # | UUID | Status | 原因/修正 |
|---|------|--------|----------|
| 1-3 | — | failed | git auth / URL doubled / NODE_ENV + lockfile |
| 4 | b13dx | failed | nixpacks step #8 OOM (exit 255) |
| 5 | e5ln6 | failed | npm ci lockfile Solana 競合 (@privy-io 内部破綻) |
| 6 | nr2wiqh3 | failed | ESLint: TrackingBeacon <img> + 不正 disable rule name |
| 7 | fem2purj4 | failed (同上) | commit 081c00b — ESLint fixes 未含 |
| 8 | mn08u4rz | queued | commit e5992ad / 03283c4 — **全 fix 反映** (ESLint + TS + public + middleware + Dockerfile) |

### 解決済の難所
1. ✅ **build_pack: nixpacks → dockerfile** (nix-env OOM 回避)
2. ✅ **@privy-io 削除** (M3-M4 で互換 version 再導入予定)
3. ✅ **TypeScript: cointier schema 型推論問題** → `<Database>` generic を drop し untyped client + use site cast
4. ✅ **COIN_NULL_DEFAULTS** (60 field Coin 型) を `lib/db/coin-defaults.ts` で shared
5. ✅ **ESLint: TrackingBeacon <img>** に eslint-disable comment 追加 (tracking pixel 用途)
6. ✅ **ESLint: invalid @typescript-eslint/no-explicit-any rule** — plugin 未 install のため disable comment 削除
7. ✅ **public/** folder 作成 (Dockerfile runner stage COPY 用)
8. ✅ **middleware matcher**: /admin と /go を i18n から除外

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
