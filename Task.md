# Task.md — Cointier

> 永久ルール TASK（グローバル CLAUDE.md）に基づく作業キュー。セッション開始時に必ず読む。
> Notion 設計書（CoinTier 壁打ち）反映済。M0-M12+ ロードマップに基づく。

---

## 🔄 進行中

- [ ] 1. **M0: 設計確定フェーズ完了**（期限: 2026-05-31）
  - [x] 1-a. CLAUDE.md 壁打ち反映（Notion 設計書 65KB を 100% 反映）
  - [x] 1-b. Task.md 全面更新（M0-M12+ ロードマップ）
  - [x] 1-c. GitHub repo 作成・main push
  - [ ] 1-d. POSS テーブル更新（Global CLAUDE.md・hard block 解消後）
  - [ ] 1-e. **ドメイン取得**（Porkbun）: `cointier.ai` + `.io` + `.co`（合計 $102/年）
  - [ ] 1-f. **商標調査**: J-PlatPat で「Cointier」「Cointier.ai」確認
  - [ ] 1-g. **SNS 一斉確保**: X / Reddit / YouTube / Medium / GitHub / npm / LinkedIn / About.me

---

## 📋 未着手（順番厳守）

### 🔌 M0 完了に必要な API 申請（並行可）
- [ ] 2. **CryptoRank Basic 契約**（$19/月）→ API キー取得
- [ ] 3. **CoinGecko Demo API キー取得**（無料）
- [ ] 4. **RootData API 申請**（アジア VC データ・差別化コア）
- [ ] 5. **Tokenomist.ai 交渉**（トークンアンロック詳細・要見積もり）
- [ ] 6. **Token Terminal API キー**（月 50 万 req 無料・登録のみ）
- [ ] 7. **Privy アカウント作成**（ウォレット統合）
- [ ] 8. **DeepSeek API キー取得**（既存 Paradigm アカウント流用検討）

### 📋 M1: MVP（2026-06〜08・日本語+英語同時）
- [ ] 9. **Next.js 15 scaffold**
  - [ ] 9-a. `create-next-app` 実行・TypeScript 構成
  - [ ] 9-b. Tailwind + shadcn/ui + Magic UI 導入
  - [ ] 9-c. **next-intl 7 言語設定**（ja/en 先行・残り 5 言語は placeholder）
  - [ ] 9-d. framer-motion / TanStack Query+Table / Zustand / Sonner 導入
- [ ] 10. **Supabase プロジェクト作成・スキーマ設計**
  - [ ] 10-a. テーブル作成（coins / vc_funds / funding_rounds / token_unlocks / ido_events / hacks / users / subscriptions / portfolios / trades / tax_reports / watchlists / alerts / pclaim_listings / ugc_posts）
  - [ ] 10-b. **多言語カラム設計**（summary_ja/en/th/vi/id/zh/ko）
  - [ ] 10-c. **RLS ポリシー設定**（MM ルール必須）
- [ ] 11. **n8n データ取得パイプライン構築**
  - [ ] 11-a. CryptoRank → Supabase 初回全量取得（370 req・1 日完了）
  - [ ] 11-b. CoinGecko 価格更新（毎時 5 call）
  - [ ] 11-c. DeFiLlama Raises 日次取得
  - [ ] 11-d. DeFiLlama Unlocks 日次取得
  - [ ] 11-e. DEXScreener リアルタイム連携
- [ ] 12. **DeepSeek V4 解説生成パイプライン**
  - [ ] 12-a. 固定システムプロンプト設計（Context Cache 最大化）
  - [ ] 12-b. 37,000 銘柄 × 2 言語（ja/en）初回生成（約 ¥6,000）
  - [ ] 12-c. 差分更新 cron（新規上場・説明変更分）
- [ ] 13. **トップページ MVP**（上位 500 銘柄ランキング）
- [ ] 14. **個別銘柄ページ**（`/[locale]/coin/[symbol]`）
  - [ ] 14-a. 価格・MC・チャート（CoinGecko Widget）
  - [ ] 14-b. VC 資金調達（上位 3 件無料 + Pro ぼかし）
  - [ ] 14-c. トークンアンロック（直近 7 日無料）
  - [ ] 14-d. AI 解説（DeepSeek 生成）
  - [ ] 14-e. アフィリ CTA（BingX / MEXC / Bitget）
- [ ] 15. **VC ページ**（`/[locale]/vc/[slug]`）— RootData 統合
- [ ] 16. **IDO カレンダー**（`/[locale]/ido`）
- [ ] 17. **アンロックカレンダー**（`/[locale]/unlocks`）
- [ ] 18. **比較ツール**（`/[locale]/compare/[s1]-vs-[s2]` + OGP 動的画像）
- [ ] 19. **pUtility 3 大ツール**（Aha Moment 起点）
  - [ ] 19-a. ポートフォリオリスクスコアラー（ウォレットアドレス入力・登録不要）
  - [ ] 19-b. トークンアンロックカレンダー（無料 7 日 / Pro 90 日）
  - [ ] 19-c. IDO ROI 計算機（全機能無料・バイラル要素）
- [ ] 20. **被リンク Tier S 一斉取得**（M1 当日）
  - [ ] 20-a. GitHub Organization 設定
  - [ ] 20-b. npm Organization 設定（@paradigmllc/cointier）
  - [ ] 20-c. LinkedIn / YouTube / Medium / WordPress.org / Zenn / Qiita / note / Reddit / About.me

### 📋 M3: アプリ化（2026-09・Capacitor）
- [ ] 21. **Capacitor 統合**
  - [ ] 21-a. `npx cap add ios` / `android`
  - [ ] 21-b. Capacitor Push Notifications 設定
  - [ ] 21-c. 生体認証（Face ID / Touch ID）
- [ ] 22. **App Store / Google Play 申請準備**
  - [ ] 22-a. アプリ名 / サブタイトル / キーワード設計
  - [ ] 22-b. スクリーンショット 5 枚（多言語）
  - [ ] 22-c. プライバシーポリシー / 利用規約
- [ ] 23. **税務レポート MVP（日本）**
  - [ ] 23-a. `lib/tax-jp/` 雑所得計算ロジック
  - [ ] 23-b. 取引履歴 CSV インポート
  - [ ] 23-c. 確定申告サマリー PDF 生成（DeepSeek + Gotenberg）

### 📋 M4-M6: Pro リリース + Builder Fee（2026-09〜11）
- [ ] 24. **Stripe 課金統合**（Free / Pro ¥1,980 / Business ¥9,800）
  - [ ] 24-a. 年額デフォルト UI（29%OFF 表示）
  - [ ] 24-b. Webhook 処理・サブスク状態同期
  - [ ] 24-c. Dunning 管理
- [ ] 25. **Privy + Hyperliquid 統合**
  - [ ] 25-a. Privy アカウント連携（メール/SNS ログイン）
  - [ ] 25-b. WalletConnect 統合
  - [ ] 25-c. **Builder Fee 承認フロー**（接続時埋め込み・goodcryptoX 方式）
  - [ ] 25-d. Hyperliquid 取引履歴インポート
- [ ] 26. **タイ語・ベトナム語追加**
  - [ ] 26-a. next-intl ロケール追加
  - [ ] 26-b. DeepSeek 一括翻訳（37,000 銘柄 × 2 言語）
  - [ ] 26-c. 現地取引所アフィリ統合（Bitkub / MEXC / Remitano / Tokocrypto）
- [ ] 27. **AI パーソナライズ機能**
  - [ ] 27-a. ポートフォリオ分析（保有銘柄リスクスコア）
  - [ ] 27-b. アンロック影響予測
  - [ ] 27-c. 関連 IDO アラート

### 📋 M6-M9: pClaim + インドネシア語・繁体字（2026-11〜2027-02）
- [ ] 28. **pClaim システム**
  - [ ] 28-a. 無料 Claim（Verified バッジ）
  - [ ] 28-b. Pro Claim ¥29,800/月（プレミアム表示）
  - [ ] 28-c. コールドアウトリーチパイプライン（n8n + Dify）
- [ ] 29. **インドネシア語・繁体字追加**（4 言語完備）
- [ ] 30. **UGC IDO 参加レポート機能**
  - [ ] 30-a. `/[locale]/ido/[slug]/reviews/[user]` 自動 SEO ページ生成
  - [ ] 30-b. 投稿通知・承認欲求設計

### 📋 M9-M12: 韓国語 + Polymarket + API 販売（2027-02〜05）
- [ ] 31. **韓国語追加**（7 言語完全展開）
- [ ] 32. **Polymarket 統合**
  - [ ] 32-a. 関連マーケット表示（銘柄詳細ページ）
  - [ ] 32-b. Verified ビルダー申請
  - [ ] 32-c. Builder Fee + アフィリ + 週次報酬の 3 収益源
- [ ] 33. **API 公開**
  - [ ] 33-a. Starter / Pro / Enterprise プラン
  - [ ] 33-b. レート制限・課金統合
  - [ ] 33-c. ドキュメント（Fumadocs）

### 📋 M12〜: MCP / x402 + Exit 準備
- [ ] 34. **MCP / x402 統合**
  - [ ] 34-a. AI エージェント向け自動課金エンドポイント
  - [ ] 34-b. MCP サーバー公開
- [ ] 35. **Polymarket Partner Tier 申請**（取引量証明後）
- [ ] 36. **Exit 準備**
  - [ ] 36-a. Google Analytics 確実な計測（M1 から導入済前提）
  - [ ] 36-b. 3 ヶ月連続財務記録
  - [ ] 36-c. Empire Flippers / Acquire.com / Flippa 出品準備

### 📋 横断タスク（任意のタイミング）
- [ ] 37. **法的レビュー**
  - [ ] 37-a. 金商法弁護士相談（投資推奨 vs 情報提供）
  - [ ] 37-b. Builder Fee 媒介性の法的判断
  - [ ] 37-c. Polymarket 連携の賭博罪リスク評価
- [ ] 38. **POSS 横展開検討**
  - [ ] 38-a. npm `@paradigmllc/crypto-tax-jp` パッケージ化
  - [ ] 38-b. npm `@paradigmllc/hyperliquid-builder` パッケージ化
  - [ ] 38-c. 6 軸評価フレーム → `stocktierai` / `nfttierai` 検討

---

## ✅ 完了

- [x] 0-a. **CLAUDE.md / Task.md / README.md / .gitignore 初期生成 + GitHub repo 作成 + main push**（完了: 2026-05-12 / commit: e3f131a）
- [x] 0-b. **Notion 設計書（CoinTier 壁打ち）100% 読破・反映**（完了: 2026-05-13）
- [x] 0-c. **CLAUDE.md 全面書き換え**（壁打ち完了版・全 11 章 ★3-4 評価）

---

## 📝 壁打ちで確定済み事項

### ブランド・基本
- ✅ 製品名: **Cointier**（旧推測の「cointierai」から確定）
- ✅ メインドメイン: `cointier.ai` + .io + .co 防衛
- ✅ タグライン: "Asia's AI-Powered Crypto Intelligence"

### 戦略
- ✅ **対象スコープ**: 37,000+ 銘柄全件（Tier A/B/C 更新頻度階層）
- ✅ **言語戦略**: ja + en 同時 M1 → 7 言語段階展開
- ✅ **マネタイズ**: 6 収益柱（CEX アフィリ / Sub / pClaim / Hyperliquid / Polymarket / API）
- ✅ **Aha Moment**: ウォレットアドレス → リスクスコア（TTFV 30 秒・登録不要）
- ✅ **pSEO 総量**: 285,000 ページ（37k×7 + カテゴリ + VC 一覧）

### 技術
- ✅ **データソース**: CryptoRank $19/月 + 8 無料/要交渉ソース
- ✅ **核心発見**: DeFiLlama（業界インフラ）/ RootData（アジア VC）/ Tokenomist（アンロック価格影響履歴）/ Token Terminal（月 50 万 req 無料）
- ✅ **アプリ戦略**: Capacitor M3-M4（Builder Fee 承認率 40%→80% 倍化）
- ✅ **ウォレット**: Privy + goodcryptoX 方式（接続時 Builder Fee 埋め込み）

### 財務
- ✅ **MRR ロードマップ**: M3 ¥37 万 / M6 ¥200 万 / M12 ¥526 万
- ✅ **コスト**: Phase 1 ¥3,500/月 / Phase 2 ¥6,500 / Phase 3 ¥22,000
- ✅ **Exit 目標**: サブスク MRR ¥300 万 × 36 倍 = **¥1.08 億**（Empire Flippers）

---

## 🚧 未確定事項（壁打ち継続が必要）

### 法的（要弁護士相談）
- [ ] 金商法「投資推奨 vs 情報提供」境界 → 「中立な情報提供」表記で整理可能か
- [ ] Builder Fee の「媒介からの利益」該当性
- [ ] Polymarket 連携の賭博罪共犯リスク

### 事業判断
- [ ] **GitHub repo 名**: `cointierai` のままか `cointier` にリネームか
- [ ] **AI 透明性レベル**: Black Box / Gray Box / **White Box（推奨）** のどれを採用するか
- [ ] **Tokenomist 契約コスト**: $X/月で予算判断

### 技術判断（M0-M1 で確定）
- [ ] フォルダ構成詳細（次セッションで壁打ち）
- [ ] ISR vs Supabase Realtime vs CoinGecko Widget の組み合わせ
- [ ] サイトマップ分割戦略（285,000 URL → 最低 6 分割）

---

## 🔁 POSS シナジー候補

### 📥 受信
- **arbidash**: CoinGecko API ラッパー / アービトラージロジック
- **Sericia**: Push PWA 基盤 / OGP 動的画像生成エンジン
- **Appexxme**: Dify workflow / Slack 承認パターン
- **paradigm-blocks**: 共通 UI（DataTable / RegionTabs 等）

### 📤 送信
- **税務レポートエンジン** → npm `@paradigmllc/crypto-tax-jp`
- **Builder Fee 統合 SDK** → npm `@paradigmllc/hyperliquid-builder`
- **6 軸評価フレーム** → `stocktierai` / `nfttierai` 量産
- **多言語 pSEO 生成エンジン** → 全 PJ 共通化
- **Privy + Builder Fee ワンフロー** → 他 Web3 PJ 流用
