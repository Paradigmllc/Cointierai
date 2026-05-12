# Task.md — cointierai

> 永久ルール TASK（グローバル CLAUDE.md）に基づく作業キュー。セッション開始時に必ず読む。

---

## 🔄 進行中

- [ ] 1. **壁打ち完了・CLAUDE.md 確定**（依存: ユーザー回答）
  - [ ] 1-a. 8 項目（事業概要・差別化・マネタイズ・技術スタック・DB・ページ構成・デプロイ・集客）の確定
  - [ ] 1-b. 3 大判断点の決定（格付け方針・AI 透明性・対象スコープ）
  - [ ] 1-c. ドメイン確定（cointierai.com / cointier.ai / 他）

---

## 📋 未着手（順番厳守）

- [ ] 2. **POSS テーブル更新**（Global CLAUDE.md に cointierai 行追加 + sync.sh push）
- [ ] 3. **商標調査**（J-PlatPat で「cointier」「coin tier」確認）
- [ ] 4. **ドメイン取得**（Cloudflare Registrar 経由）
- [ ] 5. **Next.js 15 scaffold**（壁打ち完了後）
  - [ ] 5-a. `create-next-app` 実行・基本構成
  - [ ] 5-b. Tailwind + shadcn/ui + Magic UI 導入
  - [ ] 5-c. next-intl 多言語化設定（ja/en 先行）
- [ ] 6. **Supabase プロジェクト作成・スキーマ設計**
  - [ ] 6-a. テーブル作成（coins / tier_evaluations / users / subscriptions / watchlists / alerts）
  - [ ] 6-b. RLS ポリシー設定（MM ルール準拠）
- [ ] 7. **CoinGecko Pro API 連携**（データ取得基盤）
- [ ] 8. **Dify workflow 設計**（Tier 評価ロジック）
  - [ ] 8-a. 6 軸評価プロンプト設計
  - [ ] 8-b. DeepSeek V4 Pro Context Cache 設定
- [ ] 9. **n8n workflow 設計**（定期再評価・1 日 1 回）
- [ ] 10. **トップページ MVP**（Top 100 銘柄・Tier 表示）
- [ ] 11. **個別ページ pSEO 量産**（`/coin/[symbol]`）
- [ ] 12. **Tier 別ページ**（`/tier/[s-f]`）
- [ ] 13. **比較ツール**（`/compare?coins=BTC,ETH` + OGP 動的画像）
- [ ] 14. **Stripe 課金統合**（Pro / Enterprise プラン）
- [ ] 15. **被リンク Tier S 取得**（GitHub / npm / LinkedIn / YouTube / Medium / Zenn / Qiita / Reddit / About.me）
- [ ] 16. **PayloadCMS 統合**（コンテンツ管理）
- [ ] 17. **多言語 pSEO 展開**（en → zh / ko / es / pt / de / fr / ar）
- [ ] 18. **API 公開**（`/api/tier/[symbol]` + MCP + x402 統合）
- [ ] 19. **Discord コミュニティ立ち上げ**（CLG）

---

## ✅ 完了

- [x] 0. **CLAUDE.md / Task.md / README.md / .gitignore 初期生成 + GitHub repo 作成 + main push**（完了: 2026-05-12）

---

## 📝 壁打ちメモ（未確定事項）

### 重要判断 3 点
1. **格付け方針**: 「投資推奨」明示か「中立情報提供」止まりか
   - 投資推奨 → CVR 高いが金商法リスク（金融商品取引業登録必要）
   - 情報提供 → 安全だが訴求弱
2. **AI 透明性レベル**: Black Box / Gray Box / White Box
   - Black Box → スコアのみ、モート強いが信頼性低
   - Gray Box（推奨）→ カテゴリ別寄与度、信頼性とモートの折衷
   - White Box → 全公開、信頼性高いがコピー容易
3. **対象スコープ**: Top 100 / Top 1000 / 全銘柄（10,000+）
   - Top 100: コスト低・運用楽・カバレッジ弱
   - Top 1000（推奨）: バランス
   - 全銘柄: pSEO 最大化・コスト高・誤評価リスク

### 解釈案 ABC（CLAUDE.md は A 案で仮置き）
- A. **AI 格付けプラットフォーム**（最有力・Moody's for crypto）
- B. AI Tier 別投資推奨 SaaS（リスク許容度別 portfolio 提案）
- C. 新興コイン早期発見ランキング（pre-launch スコア）

### マネタイズ案
- A. SaaS 3 プラン（Free / Pro $29 / Enterprise $299）
- B. 全無料 + 取引所アフィリエイト
- C. ハイブリッド（A + B）

---

## 🔁 POSS シナジー候補

- **受信**: arbidash の crypto データ基盤流用？（要確認）
- **送信**: Tier 格付けロジック → Paraful Levels への応用 / `stocktierai` / `nfttierai` 量産
- **npm パッケージ化候補**: `@paradigmllc/tier-evaluator`（6 軸 AI 評価エンジン）
