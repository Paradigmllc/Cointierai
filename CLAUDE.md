# cointierai — CLAUDE.md

> 最終更新: 2026-05-12（**初期版・壁打ち未完**）
> このファイルは初期推測（A案: AI Tier 格付けプラットフォーム）ベース。各セクションは壁打ち（s10-7 未確定事項）で確定後に拡張する。

---

## 目次 — 進捗ダッシュボード

| 進捗 | # | セクション | 状態メモ |
|------|---|-----------|---------|
| ★☆☆☆☆ | 1 | [🎯 事業概要・市場機会](#1--事業概要市場機会) | 初期推測・要確定 |
| ★☆☆☆☆ | 2 | [🏆 競合・差別化・参入障壁](#2--競合差別化参入障壁) | 初期推測 |
| ★☆☆☆☆ | 3 | [💰 ビジネスモデル・ユニットエコノミクス](#3--ビジネスモデルユニットエコノミクス) | 仮置き 3 プラン |
| ☆☆☆☆☆ | 4 | [📊 財務計画・KPI](#4--財務計画kpi) | 未着手 |
| ★☆☆☆☆ | 5 | [📈 ロードマップ・PMF](#5--ロードマップpmf) | M0-M3 骨格のみ |
| ☆☆☆☆☆ | 6 | [⚖️ Exit・法的リスク・コンプライアンス](#6-️-exit法的リスクコンプライアンス) | 金商法調査必要 |
| ★☆☆☆☆ | 7 | [🗺️ プロダクト設計](#7-️-プロダクト設計) | URL 設計仮置き |
| ★☆☆☆☆ | 8 | [⚙️ 技術・データ設計](#8-️-技術データ設計) | SS 第1の強み準拠 |
| ☆☆☆☆☆ | 9 | [📣 GTM・集客・エコシステム](#9--gtm集客エコシステム) | 主軸 pSEO 仮置き |
| ★☆☆☆☆ | 10 | [🖥️ 運用・組織・実装ルール](#10-️-運用組織実装ルール) | Coolify 想定 |
| ☆☆☆☆☆ | 11 | [📚 リソース一覧](#11--リソース一覧) | 随時追加 |

**⚠️ 要強化セクション**: 全セクション（壁打ち完了まで最大 ★★☆☆☆ 止まり）

**★評価**: ☆☆☆☆☆=未着手 / ★☆☆☆☆=着手 / ★★☆☆☆=骨格完成 / ★★★☆☆=概要固まった / ★★★★☆=ほぼ完成 / ★★★★★=投資家提示可

---

## 1. 🎯 事業概要・市場機会

### 1-1. 課題定義（初期推測）
- 暗号資産は 20,000+ 銘柄存在し、初心者〜中級者は「どれが信頼できるか」を判断する手段がない
- 既存サービス（CoinMarketCap / CoinGecko / Messari）は「データ羅列」止まりで「Tier 別格付け」が存在しない
- 機関投資家向けの Messari / Token Terminal は高額（$2,000+/月）かつ英語のみ

### 1-2. 解決策・価値提案
**「AI が全暗号資産を S/A/B/C/D/F の 6 段階で自動格付けする。Moody's / S&P の crypto 版。」**

- JTBD: 「投資判断のための信頼性スコアを 1 秒で得たい」
- 6 評価軸: 流動性 / チーム / テクノロジー / コミュニティ / 規制リスク / 将来性
- 全銘柄をリアルタイム再評価（DeepSeek V4 Context Cache で実効コスト$0.014/1M）

### 1-3. 市場規模（仮置き）
- TAM: グローバル暗号資産ユーザー 5.6 億人 × 月額 $10 = $67B/年
- SAM: 日本語+英語ユーザー 1 億人 × $5 = $6B/年
- SOM: 3 年で 10 万 MAU × $5 = $6M/年

### 1-4. Why Now
- 米国 spot ETF 承認後、機関マネー流入 → 個人投資家の「信頼性指標」需要急増
- DeepSeek V4 の登場で AI 格付けのコスト破壊（従来比 1/100）
- 各国規制整備（MiCA / 日本改正資金決済法）で「規制リスク評価軸」が差別化要因に

### 1-5. ターゲット（初期推測）
- **Tier 1（無料・pSEO 集客）**: 初心者投資家。検索流入「BTC 評価」「ETH 信頼性」等
- **Tier 2（Pro $29/月）**: 中級投資家。watchlist・alert・履歴
- **Tier 3（Enterprise $299/月）**: 機関投資家・税理士・FP。DD レポート PDF
- 言語: 日本語 → 英語 → 中韓+欧州主要言語（next-intl で多言語 pSEO）

---

## 2. 🏆 競合・差別化・参入障壁

### 2-1. 競合マッピング
| 競合 | 強み | 弱み |
|------|------|------|
| CoinMarketCap | データ網羅性・トラフィック | 格付けなし・広告依存 |
| CoinGecko | 多言語・API 充実 | 格付けなし |
| Messari | 機関向け詳細レポート | 高額・英語のみ・全銘柄カバーなし |
| Token Terminal | オンチェーン指標 | 専門家向け・初心者には難解 |
| Glassnode | オンチェーン分析 | 価格高・初心者向きでない |

### 2-2. 差別化軸
1. **AI による全銘柄リアルタイム Tier 格付け**（人間アナリストではない）
2. **多言語 pSEO**（CoinGecko の多言語対応より深い「Tier 別ページ」量産）
3. **OGP 動的画像「あなたの BTC は Tier S」** → SNS バイラル設計
4. **API/MCP/x402 化**（AI エージェント自動課金 → 機関投資家自動 DD）

### 2-3. 経済的モート
- データ蓄積モート: 全銘柄の Tier 履歴（過去 3 年の変動）を独占
- pSEO モート: 数十万ページの Tier 別記事（参入後発組が SEO で追いつけない）
- AI 推論モート: DeepSeek V4 Context Cache で 90%OFF（後発組の AI コスト構造が劣後）

### 2-4. 商標・SNS アカウント
- [ ] 商標調査（J-PlatPat）: 「coin tier」「cointier」未確認
- [ ] ドメイン: `cointierai.com` 仮押さえ（`.ai` は $80/年、`.com` は $12/年）
- [ ] SNS: X / Reddit / YouTube / Medium / GitHub / npm / LinkedIn → 全 dofollow Tier S 被リンク確保

---

## 3. 💰 ビジネスモデル・ユニットエコノミクス

### 3-1. 収益構造（仮置き 3 プラン）
| プラン | 月額 | 年額（20%OFF） | 機能 |
|--------|------|--------------|------|
| Free | ¥0 | — | Tier 表示のみ・3 銘柄 watchlist |
| Pro | $29/月 | $278/年 | 全機能・Tier 履歴・alert・API 1,000 calls/日 |
| Enterprise | $299/月 | $2,870/年 | DD レポート PDF・カスタム軸・API 無制限 |

### 3-2. 副次収益
- 取引所アフィリエイト（Binance / Bybit / Bitget 紹介手数料 30-50%）
- API 課金（pay-per-call: $0.01/call、AI エージェント x402 自動課金）
- ホワイトラベル SDK（地方銀行・FP 法人向け）

### 3-3. ユニットエコノミクス（試算）
- CAC: $10（pSEO + SNS バイラル中心、有料広告ゼロ）
- LTV: Pro $278 × 平均継続 18 ヶ月 = $501
- LTV/CAC: 50x（健全 3x 以上を大幅クリア）
- グロスマージン: 95%（DeepSeek V4 Cache でコスト構造圧倒的）

---

## 4. 📊 財務計画・KPI

> 壁打ち後に詳細試算。**s11 で COST-SIM ルールに従い自動算出する**。

---

## 5. 📈 ロードマップ・PMF

### 5-1. フェーズ定義
| フェーズ | 期間 | 完了条件 |
|---------|------|---------|
| **M0**: 設計確定 | 2026-05-12 〜 05-31 | CLAUDE.md ★★★★ / 壁打ち完了 |
| **M1**: MVP（Top 100 + 6 Tier） | 06-01 〜 07-31 | 100 銘柄評価・Free プラン公開 |
| **M2**: pSEO 量産（Top 1000 × 12 言語） | 08-01 〜 10-31 | 月間 10 万 PV / Pro リリース |
| **M3**: Enterprise リリース | 11-01 〜 2027-01-31 | 機関 5 社契約 |
| **M4**: API/MCP/x402 化 | 2027-02-01 〜 | AI エージェント自動課金 |

### 5-2. PMF 判定
- Sean Ellis テスト: 「これがなくなったら困る」40% 以上
- チャーン: Pro 月次 5% 以下
- NPS: 40 以上

### 5-3. Aha Moment
- TTFV: 銘柄検索 → Tier 表示まで 3 秒以内
- 比較ツール `/compare?coins=BTC,ETH` で「自分が持つコインの Tier」が一瞬で見える

---

## 6. ⚖️ Exit・法的リスク・コンプライアンス

### 6-1. 法令遵守チェックリスト（要確認）
- [ ] **金融商品取引法**: 「投資推奨」と「情報提供」の境界 → 弁護士確認必須
- [ ] **資金決済法**: 暗号資産交換業に該当しない設計（売買仲介しない）
- [ ] **景品表示法**: 「No.1」「最強」表現禁止
- [ ] **GDPR / CCPA**: ユーザーデータ管理
- [ ] **金融庁ガイドライン**: 投資助言業 vs 情報提供業の判定

### 6-2. Exit 戦略
- 5 年で ARR $5M → CoinMarketCap / CoinGecko / Crypto.com 等へ売却（ARR x4-6 倍 = $20-30M）

---

## 7. 🗺️ プロダクト設計

### 7-1. ページ構成（仮置き）
- `/` トップ（Tier 別ランキング・shadcn DataTable）
- `/coin/[symbol]` 個別 Tier 詳細レポート（pSEO 量産）
- `/tier/[s|a|b|c|d|f]` Tier 別一覧（pSEO）
- `/compare?coins=BTC,ETH` 比較ツール（バイラル）
- `/dashboard` 個人ダッシュボード（watchlist・alert）
- `/docs` ドキュメント（Fumadocs）
- `/api/tier/[symbol]` 公開 API
- `/pricing` 料金プラン
- `/about` 会社概要

### 7-2. URL 設計・pSEO
- `/{locale}/coin/{symbol}` × 12 言語 × 1,000 銘柄 = 12,000 ページ
- `/{locale}/tier/{tier}` × 12 言語 × 6 Tier = 72 ページ
- `/{locale}/compare/{symbol1}-vs-{symbol2}` × ペア組み合わせ = 数百万ページ（要選定）

### 7-3. フォルダ構成
> 詳細は壁打ち後に確定。Next.js App Router + Supabase + PayloadCMS 構成想定。

### 7-4. UX 方針
- Stripe Dashboard UI スタイル（K ルール準拠）
- 既存ページ統一（M ルール）
- Tier 色: S=金 / A=銀 / B=銅 / C=灰 / D=橙 / F=赤

---

## 8. ⚙️ 技術・データ設計

### 8-1. 技術スタック（SS 第1の強み準拠）
- Frontend: Next.js 15 / TypeScript / Tailwind / shadcn/ui + Magic UI / framer-motion / TanStack Query+Table / Zustand / Sonner
- Backend: Supabase（Postgres + RLS）/ PayloadCMS（コンテンツ管理）/ Stripe（課金）/ Resend（メール）
- AI: DeepSeek V4 Pro（Context Cache）/ Gemini Flash（画像 OCR・トークノミクス PDF 解析）
- Automation: n8n（定期評価更新）/ Dify（評価ロジック workflow）
- Infra: Coolify（self-host）/ Hetzner（将来移行）/ Cloudflare DNS+CDN
- Monitoring: Sentry / Uptime Kuma

### 8-2. Supabase テーブル（仮設計）
```
coins (id, symbol, name, chain, market_cap, ...)
tier_evaluations (id, coin_id, tier, ai_score, factors_jsonb, evaluated_at)
evaluation_factors (id, evaluation_id, factor_name, score, weight, reasoning)
users (id, email, ...)
subscriptions (id, user_id, stripe_id, tier, status, ...)
watchlists (id, user_id, coin_id, added_at)
alerts (id, user_id, coin_id, condition_jsonb, last_triggered)
api_keys (id, user_id, key_hash, scope, calls_count)
```

### 8-3. API エンドポイント（粗設計）
- `GET /api/coins` 全銘柄一覧
- `GET /api/coin/[symbol]` 個別詳細
- `GET /api/tier/[tier]` Tier 別一覧
- `POST /api/evaluate` 個別再評価トリガー（Pro+）
- `GET /api/compare` 比較データ

### 8-4. 環境変数（設計意図のみ・実値は Coolify 直接管理）
- Supabase: URL / anon_key / service_role_key
- Stripe: pk / sk / webhook_secret
- DeepSeek: API_KEY（永続 cache key）
- n8n: WEBHOOK_BASE
- CoinGecko Pro: API_KEY（価格・市場データ）
- Slack: BOT_TOKEN / CHANNEL_ID

---

## 9. 📣 GTM・集客・エコシステム

### 9-1. 主軸チャネル（SS 第3の強み 17 軸より選定）
1. **pSEO**（最優先）: 12,000 + 数百万ページ量産
2. **pPersonalize**: OGP 動的画像「あなたの {coin} は Tier {x}」→ SNS バイラル
3. **API×MCP×x402**: AI エージェント自動課金（24時間稼働の新規収益軸）
4. **被リンク Tier S（M1 当日）**: GitHub / npm / LinkedIn / YouTube / Medium / WordPress.org / Zenn / Qiita / note / Reddit / About.me
5. **CLG**: Discord コミュニティ（Tier 議論・PMF 検証）

### 9-2. SEO/GEO
- メタデータ全項目 + JSON-LD Schema（Review / Rating）
- TL;DR 先出し・自社統計（独自 Tier 算出ロジック）で GEO 強化
- Perplexity / ChatGPT / Gemini 引用獲得

---

## 10. 🖥️ 運用・組織・実装ルール

### 10-1. デプロイ構成
- GitHub `Paradigmllc/cointierai` → Coolify 自動デプロイ
- ドメイン: `cointierai.com`（仮）→ Cloudflare DNS

### 10-2. 環境変数管理
- 実値は Coolify 環境変数 UI で直接設定
- `.env.example` に項目のみ列挙（実値ハードコード禁止・V ルール）

### 10-3. 監視・障害対応
- Uptime Kuma（appexx.me インフラ共用）
- Sentry エラー監視
- 障害時: Coolify 再起動 → DigitalOcean API power_cycle（Hetzner 移行待ち）

### 10-4. プロジェクト固有規約
- UI 言語: 日本語（Paradigm 系統一）→ next-intl で多言語化
- Tier 色: S=#FFD700 / A=#C0C0C0 / B=#CD7F32 / C=#9CA3AF / D=#FB923C / F=#EF4444
- 評価ロジックは `lib/tier-evaluation/` に隔離（Dify workflow 呼び出し）

### 10-7. 未確定事項・議論中（**壁打ち対象**）
- [ ] **格付け方針**: 「投資推奨」を明示するか「中立な情報提供」に留めるか → 金商法リスク
- [ ] **AI 透明性レベル**: Black Box / Gray Box / White Box
- [ ] **対象スコープ**: Top 100 / Top 1000 / 全銘柄（10,000+）
- [ ] **arbidash との関係**: データ基盤再利用 or 独立構築
- [ ] **ドメイン確定**: `cointierai.com` / `cointier.ai` / 他
- [ ] **マネタイズ確定**: SaaS / 広告 / ハイブリッド
- [ ] **言語優先順序**: 日本語ファースト or 英語ファースト

---

## 11. 📚 リソース一覧

#### フロントエンド・フレームワーク
| ツール/サービス | 用途 | URL |
|----------------|------|-----|
| Next.js 15 | App Router | https://nextjs.org |
| shadcn/ui | UI コンポーネント | https://ui.shadcn.com |
| Magic UI | アニメーション | https://magicui.design |

#### データベース・BaaS
| ツール/サービス | 用途 | URL |
|----------------|------|-----|
| Supabase | Postgres+RLS+Auth | https://supabase.com |
| PayloadCMS | コンテンツ管理 | https://payloadcms.com |

#### AI・LLM
| ツール/サービス | 用途 | URL |
|----------------|------|-----|
| DeepSeek V4 | Tier 評価 AI（Context Cache 90%OFF） | https://deepseek.com |
| Gemini Flash | PDF / 画像 OCR | https://ai.google.dev |

#### 暗号資産データソース
| ツール/サービス | 用途 | URL |
|----------------|------|-----|
| CoinGecko Pro | 価格・市場データ API | https://www.coingecko.com/en/api |
| CoinMarketCap API | 補助データソース | https://coinmarketcap.com/api |

#### インフラ・ホスティング
| ツール/サービス | 用途 | URL |
|----------------|------|-----|
| Coolify | self-host PaaS | https://coolify.io |
| Cloudflare | DNS+CDN | https://cloudflare.com |
| Hetzner（移行先） | VPS | https://hetzner.com |

#### 法令・規制
| 機関/法令 | 内容 | URL |
|----------|------|-----|
| 金融商品取引法 | 投資推奨 vs 情報提供の境界 | https://elaws.e-gov.go.jp |
| MiCA（EU） | 暗号資産市場規制 | https://eur-lex.europa.eu |
| SEC（米） | crypto 規制動向 | https://www.sec.gov |

---

## 🔁 POSS シナジー候補（初期メモ）

- **受信**: arbidash の crypto データ基盤（CoinGecko API ラッパー等）流用検討
- **送信**: Tier 格付けロジックは Paraful Levels（企業グレード×年収 DB）に応用可
- **横展開（RR ルール）**: 同じ 6 軸評価フレームを「stocks（株式）」「NFT collections」へ転用 → `stocktierai` / `nfttierai` 量産可能
