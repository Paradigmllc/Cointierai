# Cointier — CLAUDE.md

> 最終更新: 2026-05-13（**壁打ち完了版・Notion 設計書反映**）
> Notion 原典: `CoinTier壁打ち`（3,328 行 / 65KB / 10+ 主要セッション）→ ローカルキャッシュ `.notion-cache/cointier-spec.md`（VCS 管理外）

## ブランド・基本情報

| 項目 | 内容 |
|------|------|
| **製品名** | Cointier |
| **メインドメイン** | `cointier.ai`（取得予定・Porkbun） |
| **防衛ドメイン** | `cointier.io` / `cointier.co`（合計 $102/年） |
| **タグライン** | "Asia's AI-Powered Crypto Intelligence" / 「アジア発、AIで読み解くクリプト市場」 |
| **対象市場** | アジア英語圏（SG/HK/IN/PH）+ 日本/タイ/ベトナム/インドネシア/韓国/台湾 |
| **GitHub** | `Paradigmllc/cointierai`（リポジトリ名は移行検討） |

---

## 目次 — 進捗ダッシュボード

| 進捗 | # | セクション | 状態メモ |
|------|---|-----------|---------|
| ★★★☆☆ | 1 | [🎯 事業概要・市場機会](#1--事業概要市場機会) | 壁打ち完了・市場規模試算済 |
| ★★★☆☆ | 2 | [🏆 競合・差別化・参入障壁](#2--競合差別化参入障壁) | 競合 7 社マッピング済 |
| ★★★★☆ | 3 | [💰 ビジネスモデル・ユニットエコノミクス](#3--ビジネスモデルユニットエコノミクス) | 6 収益柱確定 |
| ★★★☆☆ | 4 | [📊 財務計画・KPI](#4--財務計画kpi) | M1-M12 MRR 試算済 |
| ★★★☆☆ | 5 | [📈 ロードマップ・PMF](#5--ロードマップpmf) | M0-M12+ 確定 |
| ★★☆☆☆ | 6 | [⚖️ Exit・法的リスク・コンプライアンス](#6-️-exit法的リスクコンプライアンス) | 4 リスク領域特定・要弁護士確認 |
| ★★★★☆ | 7 | [🗺️ プロダクト設計](#7-️-プロダクト設計) | 285,000 ページ pSEO 設計確定 |
| ★★★★☆ | 8 | [⚙️ 技術・データ設計](#8-️-技術データ設計) | データソース 9 種統合済 |
| ★★★☆☆ | 9 | [📣 GTM・集客・エコシステム](#9--gtm集客エコシステム) | Aha Moment + 3 pUtility + バイラル設計 |
| ★★☆☆☆ | 10 | [🖥️ 運用・組織・実装ルール](#10-️-運用組織実装ルール) | Coolify + Hetzner 移行待ち |
| ★★☆☆☆ | 11 | [📚 リソース一覧](#11--リソース一覧) | 9 データソース + 6 アフィリ先 |

**⚠️ 要強化セクション**: s2（差別化軸の更なる尖り）/ s6（弁護士相談）/ s10（採用計画）

**★評価**: ☆☆☆☆☆=未着手 / ★☆☆☆☆=着手 / ★★☆☆☆=骨格完成 / ★★★☆☆=概要固まった / ★★★★☆=ほぼ完成 / ★★★★★=投資家提示可

---

## 1. 🎯 事業概要・市場機会

### 1-1. 課題定義
- 既存サービス（CoinMarketCap / CoinGecko / CryptoRank / Messari）は**アジア語版が翻訳のみで深掘りコンテンツゼロ**
- 日本人投資家最大の痛みである**確定申告対応サービスが弱い**（雑所得計算・取引履歴→申告書サマリーの自動化なし）
- VC・IDO・トークンアンロック等の一次情報が**アジア言語で得られない**
- 機関向け Messari / Token Terminal / Nansen は**高額（$49-2,000+/月）かつ英語のみ**

### 1-2. 解決策・価値提案
**「アジア発の AI 駆動クリプトインテリジェンス層」** — Nansen / Messari がやらない領域を埋める。

具体的価値:
1. **37,000 銘柄 × 7 言語 = 259,000 ページ**の pSEO 量産（カテゴリ等含めて 285,000+ ページ）
2. **VC・IDO・トークンアンロック・ハック履歴**を日本語/タイ語/ベトナム語で深掘り解説
3. **税務レポート自動生成**（日本の雑所得計算・確定申告サマリー）— 競合最大の欠落点
4. **Hyperliquid + Polymarket Builder Fee 統合**（情報→賭け の導線が1ページに同居）
5. **ポートフォリオ AI 分析**（DeepSeek V3 Context Cache 90%OFF）

JTBD: 「アジアの投資家が**母国語で**クリプト一次情報・税務処理・取引執行を完結したい」

### 1-3. 市場規模
APAC オンチェーン取引額（実数値・Chainalysis 2025）:
- インド: $338B（採用率世界 1 位）
- 韓国: $722B（世界 2 位）
- 日本・インドネシア・ベトナム・フィリピン・パキスタンが続く（**7 カ国が世界トップ 10 採用率**）
- SEA クリプト市場 2033 年予測: $1,944B（CAGR 8.5%）

採用率実数:
- ベトナム 21%・タイ 18%・フィリピン 13%・シンガポール 11%（世界平均 6.8% の 2-3 倍）

### 1-4. Why Now
1. **米 spot ETF 承認後の機関マネー流入** → 個人投資家の「信頼性指標」需要急増
2. **DeepSeek V4 Context Cache** → AI 解説コスト 90%OFF（$0.014/1M）でアジア多言語量産が現実的に
3. **各国規制整備**（日本改正資金決済法 / MiCA / 米 ETF / タイ SEC / SG MAS / HK SFC）→「規制リスクトラッカー」が差別化要因に
4. **Hyperliquid / Polymarket の Builder Fee エコシステム勃興** → 永続収益権をオンチェーンで取得可能に
5. **競合のアジア言語空白**（CoinGecko 等は UI 翻訳のみで VC/IDO 解説ゼロ）

### 1-5. ターゲット・優先順位
**Tier S（M1 同時リリース・英語のみで取れる）**:
- シンガポール: 英語公用語・規制クリア・機関投資家集積
- 香港: 英語公用語・アジアクリプトハブ
- インド: 英語高通用・$338B オンチェーン・採用率世界 1 位
- フィリピン: 英語公用語・採用率世界 4 位

**Tier A（M3-M6 現地語追加）**:
- 日本（雑所得計算特化・確定申告需要）
- ベトナム（採用率世界トップクラス）
- タイ（採用率 18%）
- インドネシア（人口 2.7 億）

**Tier B（M6-M12）**:
- 繁体字（台湾・香港補完）
- 韓国語（競合強い・品質整ってから）

---

## 2. 🏆 競合・差別化・参入障壁

### 2-1. 競合マッピング
| 競合 | 強み | 弱み（Cointier の空白） |
|------|------|------|
| **CoinMarketCap** | データ網羅性・トラフィック | アジア言語 UI 翻訳のみ・深掘りなし |
| **CoinGecko** | 多言語・API 充実 | アジア語 VC/IDO 解説ゼロ |
| **CryptoRank** | VC/IDO/トークノミクス DB | アジア語非対応・一般投資家向きでない |
| **Messari** | 機関向け詳細リサーチ | 高額・英語のみ・全銘柄カバーなし |
| **Token Terminal** | プロトコル収益・P/E | 専門家向け・初心者には難解 |
| **Nansen** | スマートマネー追跡 | $49/月・英語のみ・VC/IDO 弱い |
| **Hyperdash / ASXN** | Hyperliquid アナリティクス | アジア語ゼロ・CEX 統合なし |

### 2-2. ポジショニングマップ
```
                    機関・プロ向け
                         ↑
            Messari   Nansen
            Glassnode SosoValue   Token Terminal
   英語      ←─────────────────→  アジア語
   グローバル                       特化
            CoinGecko   【Cointier】← ここが完全な空白
            CryptoRank      狙い
                         ↓
                    一般個人投資家向け
```

### 2-3. 差別化軸
1. **「両立」ポジション**: CMC/CoinGecko/CryptoRank は CEX アフィリ+Hyperliquid 並走を実証済。**Cointier は + Builder Fee 統合 + アジア多言語 + アプリ内シームレス**で 4 軸全部やる唯一のプレイヤー
2. **アジア独自データ**: 金融庁届出取引所マッピング / タイ SEC 認定取引所 / ベトナム法定取引所 / **RootData 統合**（アジア VC 特化 DB）
3. **税務レポート（日本）**: 雑所得計算・確定申告サマリー自動生成 → 競合最大の欠落点・最強ロックイン
4. **OGP 動的画像**「あなたの BTC は Tier S」「あなたのポートフォリオリスク 73/100」→ SNS バイラル設計
5. **API/MCP/x402 化**（M12〜）: AI エージェント自動課金で 24 時間収益

### 2-4. 経済的モート（5 層）
1. **データロックイン**: 税務レポート蓄積・ポートフォリオ履歴・取引履歴（解約 = 確定申告データ喪失）
2. **AI パーソナライズ**: 使うほど自分専用化（ポートフォリオに基づく予測・関連 IDO 提案）
3. **Hyperliquid 取引履歴**: Cointier 内で一元管理・損益計算・税務サマリー
4. **Builder Fee 永続収益権**: ユーザーが取引する限り永続入金（オンチェーン保証）
5. **CLG コミュニティ**: Discord/Telegram と統合した日本語・タイ語・ベトナム語クリプトコミュ

### 2-5. 商標・SNS アカウント
- [ ] **商標調査**: J-PlatPat で「Cointier」「Cointier.ai」確認
- [ ] **ドメイン取得（Porkbun）**: `.ai` $80/年 + `.io` $14/年 + `.co` $8/年 = **$102/年**
- [ ] **SNS 一斉確保**（M1 当日）: X / Reddit / YouTube / Medium / GitHub / npm / LinkedIn / About.me

---

## 3. 💰 ビジネスモデル・ユニットエコノミクス

### 3-1. 6 つの収益柱（時系列）

```
        M1    M3    M6    M12
        ───────────────────────────
アフィリ ████  ████████████████████  メイン (M1〜)
サブスク       ████  ████████████   M3〜
pClaim              ████  ████████  M6〜
Builder              ████████████   M4〜 (Hyperliquid)
スポンサー                    ████  M12〜
API                       ████████  M12〜
        ───────────────────────────
MRR     ¥0   ¥37万 ¥200万 ¥500万+
```

### 3-2. Layer 1: CEX アフィリエイト（M1〜・即収益化）

| 取引所 | 報酬 | 金融庁警告 | 推奨度 |
|--------|------|-----------|--------|
| **BingX** | 登録ボーナス $4,500 + 手数料分配 | **なし** | ★★★★ 最優先 |
| **MEXC** | 手数料 40%・3 年継続 | あり | ★★★ メイン |
| **Bitget** | 登録ボーナス $6,200 | あり | ★★★ サブ |
| **KuCoin** | 手数料分配 | あり | ★★ 補完 |
| **Bybit/Binance/OKX** | — | 日本撤退 | ❌ |

**アジア英語圏向け追加**（M1 同時）:
- Coinbase / Kraken（インド・SG・HK 強い）
- Coins.ph / PDAX（フィリピン国内）
- CoinDCX / WazirX（インド国内）
- HashKey（香港認可）

**設置箇所**: 銘柄詳細ページ「この銘柄を購入できる取引所」+ IDO/IEO ページ「参加できる取引所」+ ハードウェアウォレット（Ledger $15-20 / Trezor $10-15）

### 3-3. Layer 2: サブスクリプション（M3〜・確定版）

```
┌──────────────────────────────────────────────┐
│ Free              ¥0/月                       │
│ ・銘柄基本情報（全言語）                       │
│ ・価格・MC・チャート（遅延 15 分）             │
│ ・VC 資金調達（上位 3 件/銘柄）               │
│ ・IDO/IEO 一覧（直近 3 ヶ月）                 │
│ ・AI 解説（1 日 5 銘柄まで）                  │
│ ・アラート（1 件まで）                         │
└──────────────────────────────────────────────┘
          ↓ 壁
┌──────────────────────────────────────────────┐
│ Pro               ¥1,980/月（年 ¥16,800 = 29%OFF）│
│ ・全銘柄 無制限閲覧                           │
│ ・価格リアルタイム                            │
│ ・VC 資金調達 全件                            │
│ ・IDO 全履歴 + ROI データ                    │
│ ・トークンアンロックカレンダー全期間          │
│ ・AI 解説 無制限                              │
│ ・税務レポート自動生成（日本税制対応）         │
│ ・Hyperliquid 取引履歴インポート              │
│ ・ポートフォリオ AI 分析                      │
│ ・CSV エクスポート                            │
│ ・アラート 無制限                             │
│ ・広告非表示                                  │
└──────────────────────────────────────────────┘
          ↓ 壁
┌──────────────────────────────────────────────┐
│ Business          ¥9,800/月                  │
│ ・Pro 全機能                                  │
│ ・API（10,000 req/日）                       │
│ ・自社ページ プレミアム表示（pClaim）         │
│ ・競合 VC 比較レポート                        │
│ ・月次 PDF レポート自動生成                   │
│ ・Slack アラート連携                          │
│ ・優先サポート                                │
└──────────────────────────────────────────────┘
```

**年額デフォルト戦略**: 月払い ¥1,980×12=¥23,760 vs 年払い ¥16,800（29%OFF）→ アンカリング効果で年額選択率 60% 目標 → チャーン激減

### 3-4. Layer 3: pClaim（M6〜・B2B）
- **無料 Claim**: 自社ページ基本編集 + 「Verified」バッジ
- **Pro Claim ¥29,800/月**: ロゴ・説明文プレミアム表示 / 競合比較ページ上位 / 月次閲覧数レポート / 投資家への CTA 設置
- **ターゲット**: 日本 Web3 スタートアップ 200 社+ / 国内 VC・投資ファンド 100 社+
- **コールドアウトリーチ文面**: 「御社の Cointier ページ、情報が古くなっています」→ pClaim 誘導

### 3-5. Layer 4: Hyperliquid Builder Fee（M4〜・核心）
**仕組み**: Cointier 経由で Hyperliquid 発注 → 取引額の 0.035-0.05% が**自動でオンチェーン送金**（コードが保証・取り消し不可・永続）

**通常アフィリ vs Builder Fee 比較**:
| | 通常アフィリ | Builder Fee |
|---|---|---|
| 仕組み | Cookie 紐付け・取引所裁量 | スマートコントラクト自動執行 |
| 永続性 | Cookie 期限切れで終了 | ユーザーが取引する限り永続 |
| 1 件あたり | $30-50（登録時のみ） | $35/月 × 永続（取引量依存） |

**収益試算**:
- アクティブユーザー 1,000 人 × 月 $50,000 取引 × 0.05% = **$25,000/月（¥375 万）**
- 承認率は接続時埋め込み（goodcryptoX 方式）で 70-85%（通常 30-40% の 2 倍）

**Privy 統合戦略**: メール/SNS ログイン → バックグラウンドでウォレット自動生成 → Builder Fee 承認を 1 フロー完結 → クリプト初心者でも使える

### 3-6. Layer 5: Polymarket Builder Fee + アフィリ（M6〜）
- **3 ティア構造**: Unverified（即開始）→ Verified（審査・RevShare 解放）→ Partner（招待制・Base Fee Split）
- **収益源 3 つ**: アフィリ（初回 $10 + 取引手数料 30%・180 日）/ Builder Fee（CLOB V2）/ 週次報酬（Verified 以上）
- **法的注意**: 賭博罪リスク → 初期は表示のみ・外部リンクで誘導

### 3-7. Layer 6: API 販売（M12〜・流量証明後）
- Starter: 10,000 req/日 ¥9,800/月
- Pro: 100,000 req/日 ¥49,800/月
- Enterprise: 要相談 ¥100,000+/月
- **MCP / x402 化**: AI エージェント自動課金で 24 時間稼働の新規収益軸

### 3-8. ユニットエコノミクス
- **CAC**: $10（pSEO + SNS バイラル中心・有料広告ゼロ）
- **LTV**: Pro 年払い ¥16,800 × 平均 18 ヶ月 = ¥25,200（¥168）
- **LTV/CAC**: 25x（健全 3x を大幅クリア）
- **グロスマージン**: 95%（DeepSeek V4 Cache で AI コスト構造圧倒的）

---

## 4. 📊 財務計画・KPI

### 4-1. MRR ロードマップ
| フェーズ | 期間 | アフィリ | Pro 件数 | Business 件数 | Builder Fee | MRR 合計 |
|---------|------|---------|---------|--------------|-------------|---------|
| M3 | 2026-08 | ¥22万 | 50 件 (¥10万) | 5 件 (¥5万) | — | **¥37万** |
| M6 | 2026-11 | ¥75万 | 300 件 (¥59万) | 30 件 (¥29万) | ¥37万 | **¥200万** |
| M12 | 2027-05 | ¥150万 | 1,000 件 (¥198万) | 100 件 (¥98万) | ¥80万 | **¥526万** |

### 4-2. コスト構造（月次）
| 項目 | Phase 1 (MAU 5K) | Phase 2 (MAU 50K) | Phase 3 (MAU 200K) |
|------|------|------|------|
| CryptoRank Basic | $19 | $19 | $19 |
| CoinGecko / DeFiLlama 等 | $0 | $0 | $129 |
| DeepSeek V4 Cache | ¥数百円 | ¥数千円 | ¥1万 |
| Supabase | $0 (Free) | $25 (Pro) | $25 |
| Cloudflare Pages | $0 | $0 | $0 |
| Coolify VPS | $48 | $48 | $96 |
| **月次合計** | **≒¥3,500** | **≒¥6,500** | **≒¥22,000** |

**MRR ¥500 万に対する Phase 3 コスト率: 0.04%**

### 4-3. 損益分岐点
- Phase 1: M3（¥37 万 MRR）でアフィリ単体で黒字化
- データ取得コストは MRR の **0.07% 以下**（構造上ほぼ無視できる）

### 4-4. Exit 計画
- **Empire Flippers**: サブスク MRR × 30-40 倍が標準評価
- **目標**: M18 で サブスク MRR ¥300 万到達 → 評価額 **¥1.08 億**
- **準備**: Google Analytics 初日導入 / 3 ヶ月連続財務記録 / トラフィックソース分析

---

## 5. 📈 ロードマップ・PMF

### 5-1. フェーズ定義
| フェーズ | 期間 | 主な完了条件 |
|---------|------|---------|
| **M0**: 設計確定 | 2026-05 | CLAUDE.md ★4+ / ドメイン取得 / 商標調査 |
| **M1-M3**: MVP（日英同時） | 2026-06〜08 | 上位 500 銘柄・Free 公開・CEX アフィリ稼働・pUtility 3 ツール |
| **M3-M4**: アプリ化 | 2026-09 | Capacitor / App Store / Privy / 税務レポート MVP |
| **M4-M6**: タイ・ベトナム + Builder Fee | 2026-09〜11 | 2 言語追加・Hyperliquid 統合・Pro リリース |
| **M6-M9**: インドネシア・繁体字 + pClaim | 2026-11〜2027-02 | 4 言語追加・pClaim 開始・月間 10 万 PV |
| **M9-M12**: 韓国語 + Polymarket | 2027-02〜05 | 7 言語完全展開・Polymarket Verified・MRR ¥500 万 |
| **M12〜**: API/MCP/x402 + Exit 準備 | 2027-05〜 | API 公開・MCP 統合・Partner Tier 申請・Exit DD |

### 5-2. PMF 判定基準
- **Sean Ellis テスト**: 「これがなくなったら困る」40% 以上
- **チャーン**: Pro 月次 5% 以下（年払いで構造的に低減）
- **NPS**: 40 以上
- **週次アクティブ率**: 30%+

### 5-3. Aha Moment 設計（TTFV < 30 秒）
**最強候補確定: ウォレットアドレス入力 → ポートフォリオリスクスコア即表示**
- 登録不要で実行可能
- 「自分のデータ」が出る = パーソナライズ感
- 詳細レポートは Pro 登録誘導
- バイラル係数: 結果シェア CTR 3-8%（1,000 シェア → 30-80 新規）

### 5-4. KPI 計測体制
- **Acquisition**: pSEO 流入数（銘柄×言語別） / pUtility ツール利用数
- **Activation**: ツール→登録転換率（目標 5%+） / 登録→ウォレット接続率（40%+）
- **Retention**: 週次アクティブ率（30%+） / アラート→訪問率
- **Revenue**: Free→Pro 転換率（3-5%） / Pro→Business 転換率
- **Referral**: リスクスコアシェア率 / UGC 投稿数/月

---

## 6. ⚖️ Exit・法的リスク・コンプライアンス

### 6-1. 法的リスク領域（要弁護士確認）
1. **金融商品取引法**: 「投資推奨」vs「中立情報提供」境界 → 「ニュートラルな情報提供」表記で整理
2. **賭博罪（刑法 185 条）**: Polymarket 連携の共犯・幇助リスク → 初期は表示のみ
3. **Builder Fee の媒介性**: 「永続的な取引収益分配」が「媒介からの利益」と見なされるリスク
4. **景品表示法**: 「No.1」「最強」表現禁止 / アフィリ「PR・広告」表記義務
5. **各国規制**:
   - 日本: 改正資金決済法 / 金融庁ガイドライン
   - タイ: PDPA / SEC 認定取引所マッピング
   - ベトナム: Decree 13 / 法定取引所パイロット
   - インドネシア: PDP Law / BAPPEBTI
   - SG: MAS PS Act
   - HK: SFC SFO
   - GDPR / CCPA（多言語展開のため）

### 6-2. 帰属表示義務（規約遵守）
- **CryptoRank Basic**: `BY-CC-SA` ライセンス・帰属表示必須
- **CoinGecko**: 「Data provided by CoinGecko」+ リンク必須
- **DeFiLlama**: 完全無料・商用可・帰属表示推奨
- **Messari**: 無料エンドポイント帰属表示必須

### 6-3. 規約 NG 事項（絶対禁止）
- ❌ CryptoRank データを API として再販
- ❌ 利用規約を破るスクレイピング（DEXScreener / CryptoRank 等）
- ❌ 金融庁警告済み取引所を「推奨」する表現（→「利用可能な取引所」表現に留める）

### 6-4. Exit 戦略
- **想定バイヤー**: CoinGecko / CoinMarketCap / Crypto.com / アジアの暗号資産メディア企業
- **バリュエーション目標**: サブスク MRR ¥300 万 × 36 倍 = **¥1.08 億**（Empire Flippers 基準）
- **DD 準備リスト**: 3 ヶ月連続財務記録 / 収益の再現性証明 / トラフィックソース分析 / Google Analytics 初日導入

---

## 7. 🗺️ プロダクト設計

### 7-1. ページ構成
**コアページ**:
- `/` トップ（注目 VC + 直近 IDO + Tier 別ランキング）
- `/[locale]/coin/[symbol]` 個別銘柄詳細（37,000 銘柄 × 7 言語 = **259,000 ページ**）
- `/[locale]/vc/[slug]` VC ポートフォリオ詳細（RootData 統合）
- `/[locale]/ido` IDO/IEO カレンダー
- `/[locale]/unlocks` トークンアンロックカレンダー（Tokenomist 統合）
- `/[locale]/hacks` ハック履歴 DB（DeFiLlama 統合・日本語化）
- `/[locale]/compare/[s1]-vs-[s2]` 比較ツール（バイラル）
- `/[locale]/dashboard` 個人ダッシュボード（Pro: ポートフォリオ・税務）
- `/[locale]/pricing` 料金プラン
- `/[locale]/docs` ドキュメント（Fumadocs）

**pUtility 3 大ツール（Aha Moment 起点）**:
- `/[locale]/tools/risk-score` ポートフォリオリスクスコアラー（ウォレットアドレス入力・登録不要）
- `/[locale]/tools/unlock-calendar` トークンアンロックカレンダー（無料 7 日 / Pro 90 日）
- `/[locale]/tools/ido-roi` IDO ROI 計算機（バイラル要素・全機能無料）

**API**:
- `/api/coin/[symbol]` 公開 API
- `/api/vc/[slug]` VC データ API
- `/api/mcp/*` MCP エンドポイント（AI エージェント自動課金 / x402 対応）

### 7-2. URL 設計・pSEO 総量
```
銘柄ページ:    37,000 × 7 言語 = 259,000
カテゴリ:      500 × 7 = 3,500
VC 一覧:       10,000 × 7 = 70,000
─────────────────────────────────────
合計:          約 285,000 ページ（自動生成）
```

**サイトマップ分割**: Google 上限 50,000 URL/ファイル → 最低 6 分割 + サイトマップインデックス

### 7-3. フォルダ構成
> 詳細は M0 実装フェーズで確定。Next.js App Router + next-intl + Supabase + PayloadCMS 構成。

### 7-4. UX 方針
- Stripe Dashboard UI スタイル（K ルール準拠）
- Tier 色: S=#FFD700 / A=#C0C0C0 / B=#CD7F32 / C=#9CA3AF / D=#FB923C / F=#EF4444
- Magic UI / framer-motion でアニメーション
- モバイルファースト（M3 で Capacitor アプリ化）

### 7-5. フィーチャーゲーティング設計
- 言語切替: 全プラン無料（SEO 上は全部無料が正解）
- VC 資金調達: 上位 3 件無料 → ぼかし表示「残り 47 件 Pro で見る」
- トークンアンロック: 直近 7 日無料 → Pro で 90 日 + アラート
- 税務レポート: Pro 限定（確定申告期 1-3 月に最強の Free→Pro 転換装置）
- CSV エクスポート: Pro 以上
- API: Business 以上

---

## 8. ⚙️ 技術・データ設計

### 8-1. 技術スタック（SS 第1の強み準拠）
**Frontend**:
- Next.js 15 / TypeScript / Tailwind CSS
- shadcn/ui + Magic UI / framer-motion
- TanStack Query + Table / Zustand / Sonner
- next-intl（7 言語対応）

**Backend**:
- Supabase（Postgres + RLS + Auth）
- PayloadCMS（コンテンツ管理）
- Stripe（課金）/ Resend（メール）

**AI**:
- DeepSeek V4 Pro（Context Cache 90%OFF / 解説・スコアリング）
- Gemini Flash（PDF / 画像 OCR / トークノミクス資料解析）

**Automation**:
- n8n（定期取得・再評価）
- Dify（評価ロジック workflow）

**Mobile（M3-M4）**:
- Capacitor（iOS / Android・Next.js コード 90%+ 流用）
- Capacitor Push Notifications
- 生体認証（Face ID / Touch ID）

**Wallet（M4〜）**:
- **Privy**（メール/SNS ログインでウォレット自動生成）
- WalletConnect / MetaMask / Rabby
- Hyperliquid SDK（`@nktkas/hyperliquid`）

**Infra**:
- Coolify（self-host PaaS）→ Hetzner（移行予定）
- Cloudflare DNS + Pages + CDN
- Sentry / Uptime Kuma 監視

### 8-2. データソース（9 種統合・月次コスト $19 のみ）
| カテゴリ | ソース | コスト | 用途 |
|---------|--------|-------|------|
| 価格・基本 | **CoinGecko Demo** | $0 | 月 10,000 call・帰属表示必須 |
| 価格・補完 | CoinPaprika | ❌ 商用禁止・**除外** | — |
| VC・資金調達（アジア） | **RootData API** | 要申請 | **最重要・差別化コア** |
| VC・資金調達（全般） | **DeFiLlama Raises** | $0 | Crunchbase 代替・完全無料 |
| IDO/IEO/トークノミクス | **CryptoRank Basic** | **$19/月** | 唯一の課金ソース |
| トークンアンロック | **Tokenomist.ai** | 要交渉 | 価格影響履歴データが他に無い独自性 |
| トークンアンロック補完 | DeFiLlama Unlocks | $0 | — |
| プロトコル収益・P/E | **Token Terminal** | $0（**月 50 万 req 無料**） | 株式分析的指標・機関投資家層獲得 |
| DeFi TVL | DeFiLlama | $0 | 業界標準 |
| DEX 流動性 | **DEXScreener** | $0 | 300 req/分・商用可 |
| デリバティブ | **Hyperliquid API** | $0 | Builder Fee 連携 |
| ソーシャル | LunarCRUSH | $0（無料枠） | センチメント・強弱気 |
| ハック履歴 | DeFiLlama Hacks | $0 | 日本語化で独自性 |
| アジア独自 | pClaim + 金融庁 DB | $0 | 自社一次情報資産 |

**合計月次コスト: $19（CryptoRank のみ）**

### 8-3. Supabase テーブル設計
```sql
-- 銘柄マスター
coins (id, symbol, name, chain, market_cap, ...,
       summary_ja text, summary_en text, summary_th text,
       summary_vi text, summary_id text, summary_zh text, summary_ko text)

-- VC・資金調達
vc_funds (id, name, country, focus, portfolio_count)
funding_rounds (id, coin_id, vc_id, amount, round_type, date)

-- トークン関連
token_unlocks (id, coin_id, unlock_date, amount, percentage_of_supply, historical_impact)
ido_events (id, coin_id, exchange, start_date, end_date, price, roi_data)

-- セキュリティ
hacks (id, coin_id, date, amount_lost, root_cause, description_ja)

-- ユーザー
users (id, email, privy_user_id, locale, ...)
subscriptions (id, user_id, stripe_id, plan, status, ...)
wallets (id, user_id, address, chain, connected_at)
builder_fee_approvals (id, user_id, builder_address, max_fee_rate, approved_at)

-- ポートフォリオ・税務
portfolios (id, user_id, coin_id, amount, avg_price)
trades (id, user_id, coin_id, type, amount, price, fee, executed_at, source)
tax_reports (id, user_id, fiscal_year, total_gain, total_loss, pdf_url, generated_at)

-- 機能
watchlists (id, user_id, coin_id, added_at)
alerts (id, user_id, coin_id, condition_jsonb, last_triggered)
api_keys (id, user_id, key_hash, scope, calls_count)

-- B2B
pclaim_listings (id, project_id, plan, verified, premium_until)
ugc_posts (id, user_id, type, slug, content_jsonb, lang)
```

**RLS ポリシー**: 全テーブル user_id ベース最小権限（MM ルール必須）

### 8-4. API エンドポイント
**公開**:
- `GET /api/coin/[symbol]?lang=ja` 個別銘柄
- `GET /api/coins?tier=A&lang=ja` Tier 別一覧
- `GET /api/vc/[slug]` VC 詳細
- `GET /api/ido?status=upcoming` IDO カレンダー
- `GET /api/unlocks?days=30` アンロック予定

**Pro 限定**:
- `POST /api/portfolio/analyze` AI ポートフォリオ分析
- `GET /api/tax-report?year=2025` 税務レポート PDF 生成
- `POST /api/alerts` カスタムアラート

**MCP / x402**（M12〜）:
- `/api/mcp/coin` AI エージェント向け（自動課金）
- `/api/mcp/vc` 同上

### 8-5. 環境変数（設計意図のみ・実値は Coolify UI 管理）
- Supabase: `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- DeepSeek: `DEEPSEEK_API_KEY`（永続 cache key）
- CryptoRank: `CRYPTORANK_API_KEY`
- CoinGecko: `COINGECKO_API_KEY`（Demo）
- RootData: `ROOTDATA_API_KEY`（申請後）
- Tokenomist: `TOKENOMIST_API_KEY`（交渉後）
- Token Terminal: `TOKEN_TERMINAL_API_KEY`
- Privy: `PRIVY_APP_ID` / `PRIVY_APP_SECRET`
- Hyperliquid: `HYPERLIQUID_BUILDER_ADDRESS`
- n8n: `N8N_WEBHOOK_BASE`
- Slack: `SLACK_BOT_TOKEN` / `SLACK_CHANNEL_ID`

### 8-6. n8n パイプライン設計
```
[Cron: 毎時]
  CoinGecko API → 上位 500 銘柄一括取得（5 call）→ Supabase upsert

[Cron: 日次]
  CryptoRank API → VC/IDO/トークノミクス差分 → Supabase
  DeFiLlama Raises → 資金調達差分 → Supabase
  Tokenomist API → アンロック予定 → Supabase
  → DeepSeek V4（7 言語解説生成・キャッシュヒット）→ Supabase
  → ISR revalidate → pSEO ページ自動更新

[Cron: 週次]
  全 37,000 銘柄差分更新（変動があった銘柄のみ）

[Event: ユーザー操作]
  ウォレット接続 → Privy → Builder Fee 承認モーダル
  税務レポート生成 → DeepSeek → PDF → Supabase Storage
```

---

## 9. 📣 GTM・集客・エコシステム

### 9-1. Growth Loop（3 ループ統合設計）
```
【メインループ】
pSEO（285,000 ページ）→ 検索流入
  → pUtility（リスクスコア・アンロック・IDO ROI）
  → Aha Moment（TTFV < 30 秒）
  → 無料登録（Googleログイン1クリック）
  → Activation（ポートフォリオ接続）
  → 習慣化（週次アンロックアラート）
  → 壁で転換 → Pro 登録
  → データ蓄積（税務・取引履歴）
  → ロックイン（解約不可能状態）

【バイラルループ】
リスクスコア結果 → OGP 動的画像 → X・Line でシェア
  → 新規流入 → メインループへ

【UGC ループ】
IDO 参加レポート投稿 → /[locale]/ido/[slug]/reviews/[user] 自動生成
  → 「○○ IDO 参加レポート」検索流入
  → 新規ユーザー Aha Moment → メインループへ
```

### 9-2. 主軸チャネル（SS 第3 の強み 17 軸より選定）
1. **pSEO**（最優先）: 285,000 ページ・7 言語・競合空白地帯
2. **pUtility 3 ツール**: 登録不要 Value 提供で TTFV 30 秒
3. **pPersonalize**: OGP 動的画像「あなたの BTC は Tier S」「あなたのリスク 73/100」
4. **API×MCP×x402**: AI エージェント自動課金（M12〜）
5. **被リンク Tier S**（M1 当日確保）: GitHub / npm / LinkedIn / YouTube / Medium / WordPress.org / Zenn / Qiita / note / Reddit / About.me
6. **CLG**: Discord/Telegram コミュニティ（日本語・タイ語・ベトナム語）
7. **pUGC**: IDO 参加レポート投稿 → SEO 資産自律増殖

### 9-3. SEO / GEO
- メタデータ全項目 + JSON-LD Schema（Review / Rating / FAQPage）
- hreflang 設定（7 言語相互参照）
- canonical 設計（多言語重複コンテンツ回避）
- TL;DR 先出し・自社統計（独自スコアリングロジック）で GEO 強化
- Perplexity / ChatGPT / Gemini / Copilot 引用獲得

### 9-4. ASO（モバイル版 pSEO）
**アプリ名**: Cointier - Asia Crypto Intelligence
**サブタイトル**: VC・IDO・トークン分析

**多言語ストアページ**: 日本語 / 英語 / タイ語 / ベトナム語 → App Store 検索を多言語で独占

**スクリーンショット 5 枚（CVR 最重要）**: 銘柄ダッシュボード / VC 資金調達 / アンロックカレンダー / Hyperliquid 取引分析 / プッシュ通知画面

### 9-5. Free→Pro 転換設計（壁の設計）
3 つの効果的な壁:
1. **「残り 47 件」ぼかし表示** → 具体的件数で「向こうに何があるか」明確
2. **「○○の大型アンロックが 3 日後」+ アラートは Pro** → 緊急性
3. **「昨年の取引を自動集計しました。PDF 生成は Pro」** → 確定申告期（1-3 月）に最強

---

## 10. 🖥️ 運用・組織・実装ルール

### 10-1. デプロイ構成
- GitHub `Paradigmllc/cointierai` → Coolify 自動デプロイ
- ドメイン: `cointier.ai`（メイン） + `.io` / `.co`（防衛・転送）
- DNS: Cloudflare

### 10-2. 環境変数管理
- 実値は Coolify 環境変数 UI で直接設定
- `.env.example` には項目名のみ列挙（V ルール準拠）

### 10-3. 監視・障害対応
- Uptime Kuma（appexx.me インフラ共用）
- Sentry エラー監視
- 障害時: Coolify 再起動 → DigitalOcean API power_cycle（Hetzner 移行待ち）

### 10-4. プロジェクト固有規約
- **UI 言語**: 日本語 + 英語同時（M1）→ next-intl で 7 言語拡張
- **Tier 色**: S=#FFD700 / A=#C0C0C0 / B=#CD7F32 / C=#9CA3AF / D=#FB923C / F=#EF4444
- **評価ロジック**: `lib/tier-evaluation/` に隔離（Dify workflow 呼び出し）
- **税務ロジック**: `lib/tax-jp/` に日本税制処理を集約（雑所得計算・損益通算ルール）
- **ウォレット統合**: `lib/wallet/` に Privy + WalletConnect + Hyperliquid SDK 抽象化

### 10-5. AI コスト削減原則（PP ルール準拠）
- 全 LLM 呼び出しは DeepSeek V4 Context Cache（90%OFF = $0.014/1M）を最優先
- システムプロンプトに「7 言語解説生成ルール」を固定 → キャッシュヒット率最大化
- Gemini Flash は PDF / 画像 OCR / トークノミクス資料解析専用

### 10-6. POSS シナジー（双方向チェック）
**受信候補**:
- arbidash（アービトラージ）の CoinGecko API ラッパー流用
- Sericia の Push PWA 設計流用
- Appexxme の Dify workflow パターン

**送信候補**（RR ルール）:
- Tier 評価フレーム → `stocktierai` / `nfttierai` 量産
- 税務レポートエンジン → npm `@paradigmllc/crypto-tax-jp`
- Builder Fee 統合 SDK → npm `@paradigmllc/hyperliquid-builder`
- 多言語 pSEO 生成エンジン → 全 PJ 共通化

### 10-7. 未確定事項・要弁護士確認
- [ ] **金融商品取引法**: 「投資推奨」表記の境界
- [ ] **賭博罪**: Polymarket 連携の共犯リスク評価
- [ ] **Builder Fee 媒介性**: 「永続収益分配」の法的位置付け
- [x] ~~ドメイン確定（cointier.ai 確定）~~
- [x] ~~マネタイズ確定（6 収益柱）~~
- [x] ~~対象スコープ確定（37,000 銘柄全件・Tier A/B/C 更新頻度階層）~~
- [x] ~~言語優先順序確定（ja + en 同時 M1）~~

---

## 11. 📚 リソース一覧

### フロントエンド・フレームワーク
| ツール/サービス | 用途 | URL |
|----------------|------|-----|
| Next.js 15 | App Router | https://nextjs.org |
| shadcn/ui | UI コンポーネント | https://ui.shadcn.com |
| Magic UI | アニメーション | https://magicui.design |
| next-intl | 7 言語対応 | https://next-intl-docs.vercel.app |
| Capacitor | iOS/Android アプリ化 | https://capacitorjs.com |

### データベース・BaaS・決済
| ツール/サービス | 用途 | URL |
|----------------|------|-----|
| Supabase | Postgres + RLS + Auth | https://supabase.com |
| PayloadCMS | コンテンツ管理 | https://payloadcms.com |
| Stripe | 課金 | https://stripe.com |
| **Privy** | ウォレット統合 + Builder Fee | https://privy.io |

### AI・LLM
| ツール/サービス | 用途 | URL |
|----------------|------|-----|
| DeepSeek V4 Pro | 解説・スコアリング（Context Cache 90%OFF） | https://deepseek.com |
| Gemini Flash | PDF / 画像 OCR | https://ai.google.dev |

### 暗号資産データソース
| ツール/サービス | 用途 | コスト |
|----------------|------|--------|
| CoinGecko Demo | 価格・MC | $0（月 10K call） |
| **CryptoRank Basic** | VC/IDO/トークノミクス | **$19/月** |
| **DeFiLlama** | TVL/Raises/Unlocks/Hacks | $0 |
| **RootData** | アジア VC 特化 | 要申請 |
| **Tokenomist.ai** | トークンアンロック詳細 | 要交渉 |
| **Token Terminal** | プロトコル収益・P/E | $0（月 50 万 req） |
| **DEXScreener** | DEX 流動性 | $0 |
| **Hyperliquid API** | デリバティブ | $0 |
| LunarCRUSH | ソーシャル | $0（無料枠） |
| Mobula | オンチェーン補完 | $0〜 |

### 取引所アフィリ（M1〜）
| 取引所 | 報酬 | 金融庁警告 |
|--------|------|----------|
| BingX | $4,500 + 手数料分配 | **なし**（最優先） |
| MEXC | 手数料 40%・3 年継続 | あり |
| Bitget | $6,200 登録ボーナス | あり |
| KuCoin | 手数料分配 | あり |
| Coinbase / Kraken | 各国アフィリ | — |
| Coins.ph / PDAX | フィリピン国内 | — |
| CoinDCX / WazirX | インド国内 | — |
| HashKey | 香港認可 | — |
| Ledger / Trezor | $10-20/件 | — |

### Builder Fee エコシステム（M4〜）
| サービス | 用途 | コスト |
|---------|------|--------|
| Hyperliquid | Perps Builder Fee 0.035-0.05% | $0（コード執行） |
| `@nktkas/hyperliquid` | TypeScript SDK | OSS |
| Polymarket | 予測市場 Builder Fee | M6〜 |

### インフラ・ホスティング
| ツール/サービス | 用途 | URL |
|----------------|------|-----|
| Coolify | self-host PaaS | https://coolify.io |
| Hetzner（移行先） | VPS | https://hetzner.com |
| Cloudflare | DNS + Pages + CDN | https://cloudflare.com |
| Porkbun | ドメイン | https://porkbun.com |

### 法令・規制
| 機関/法令 | 内容 | URL |
|----------|------|-----|
| 金融商品取引法（日本） | 投資推奨 vs 情報提供 | https://elaws.e-gov.go.jp |
| 賭博罪・刑法 185 条 | Polymarket 連携リスク | — |
| 改正資金決済法（日本） | 暗号資産交換業 | — |
| MiCA（EU） | 暗号資産市場規制 | https://eur-lex.europa.eu |
| MAS PS Act（SG） | シンガポール規制 | https://www.mas.gov.sg |
| HK SFC SFO | 香港規制 | https://www.sfc.hk |
| PDPA（タイ） | 個人情報保護 | — |
| Decree 13（ベトナム） | 同上 | — |
| 金融庁・暗号資産警告リスト | 取引所推奨判断 | https://www.fsa.go.jp |

### 競合・参考
| サービス | 種別 | URL |
|---------|------|-----|
| CoinMarketCap | 主要競合 | https://coinmarketcap.com |
| CoinGecko | 主要競合 | https://www.coingecko.com |
| CryptoRank | データソース兼競合 | https://cryptorank.io |
| Messari | 機関向け競合 | https://messari.io |
| Nansen | オンチェーン分析 | https://www.nansen.ai |
| Hyperdash | Hyperliquid 競合 | https://hyperdash.info |
| goodcryptoX | Builder Fee 実装参考 | https://goodcryptox.com |
| WunderTrading | Hyperliquid Builder 競合 | https://wundertrading.com |

---

## 🔁 POSS シナジー候補（壁打ち反映版）

### 📥 受信（他 PJ から流用検討）
- **arbidash**: CoinGecko API ラッパー / アービトラージロジック流用
- **Sericia**: Push PWA 基盤 / OGP 動的画像生成
- **Appexxme**: Dify workflow 設計 / Slack 承認パターン
- **paradigm-blocks**: 共通 UI（DataTable / RegionTabs 等）

### 📤 送信（他 PJ・新規 PJ へ展開可能）
- **6 軸評価フレーム** → `stocktierai`（株式） / `nfttierai`（NFT collections）量産
- **税務レポートエンジン** → npm `@paradigmllc/crypto-tax-jp`（日本税制特化 SDK）
- **Builder Fee 統合 SDK** → npm `@paradigmllc/hyperliquid-builder`
- **多言語 pSEO 生成エンジン** → 全 PJ 共通化（DeepSeek Cache 最適化済）
- **Privy + Builder Fee ワンフロー実装** → Sericia / 他 Web3 PJ 流用
