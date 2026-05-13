# Cointier

> **Asia's AI-Powered Crypto Intelligence** — アジア発、AI で読み解くクリプト市場

[![Status](https://img.shields.io/badge/status-M0_design_phase-yellow)](./CLAUDE.md)
[![License](https://img.shields.io/badge/license-private-red)]()

## 概要

アジア発の AI 駆動クリプトインテリジェンス層。**37,000+ 銘柄 × 7 言語 = 285,000 ページ** の pSEO で、CoinMarketCap / CoinGecko / CryptoRank / Messari がやらない領域を埋める。

### 核心価値
- **VC・IDO・トークンアンロック・ハック履歴**を日本語/タイ語/ベトナム語で深掘り
- **税務レポート自動生成**（日本の雑所得計算・確定申告サマリー）
- **Hyperliquid + Polymarket Builder Fee 統合**（情報→取引執行の一気通貫）
- **AI パーソナライズ**（DeepSeek V4 Context Cache 90%OFF）
- **アプリ化**（Capacitor + Privy で Builder Fee 承認率 80%）

### 競合との空白象限
```
                    機関・プロ向け
                         ↑
            Messari   Nansen
            Token Terminal   SosoValue
   英語      ←─────────────────→  アジア語
   グローバル                       特化
            CoinGecko   【Cointier】← この空白
            CryptoRank      狙い
                         ↓
                    一般個人投資家向け
```

## ステータス

**🚧 M0 設計フェーズ** — Notion 壁打ち（65KB）完了、CLAUDE.md / Task.md 反映済み。

### ロードマップ
| フェーズ | 期間 | 完了条件 | MRR |
|---------|------|---------|-----|
| **M0** 設計 | 2026-05 | CLAUDE.md ★4+ / ドメイン取得 | ¥0 |
| **M1-M3** MVP（日英同時） | 2026-06〜08 | 上位 500 銘柄 / CEX アフィリ稼働 | ¥37 万 |
| **M3-M4** アプリ化 | 2026-09 | Capacitor / 税務レポート MVP | — |
| **M4-M6** Pro + Builder Fee | 2026-09〜11 | タイ・ベト追加 / Hyperliquid 統合 | ¥200 万 |
| **M6-M9** pClaim + 4 言語 | 2026-11〜2027-02 | インドネシア・繁体字追加 | — |
| **M9-M12** Polymarket + API | 2027-02〜05 | 韓国語完備 / API 公開 | ¥500 万+ |
| **Exit** | 2027 後半 | Empire Flippers 売却 | **¥1.08 億評価** |

## 6 つの収益柱
1. **CEX Affiliate**（M1〜）: BingX / MEXC / Bitget + アジア各国取引所
2. **Subscription**（M3〜）: Free / Pro ¥1,980 / Business ¥9,800
3. **pClaim Pro**（M6〜）: ¥29,800/月（VC・プロジェクト向け）
4. **Hyperliquid Builder Fee**（M4〜）: 0.035-0.05% 永続オンチェーン収益
5. **Polymarket Builder Fee**（M6〜）: アフィリ + 週次報酬 + Builder Fee
6. **API / MCP / x402**（M12〜）: AI エージェント自動課金

## 主な技術スタック
- **Frontend**: Next.js 15 + TypeScript + Tailwind + shadcn/ui + Magic UI + next-intl（7 言語）
- **Backend**: Supabase（Postgres + RLS）+ PayloadCMS + Stripe + Resend
- **AI**: **OpenRouter ゲートウェイ統一**（`deepseek/deepseek-v4-pro` Prompt Caching 自動 + `google/gemini-2.5-flash`・1 キーで全 LLM 統一・自動フェイルオーバー）
- **Mobile**: Capacitor（iOS/Android）+ Privy（ウォレット統合）
- **Wallet**: Privy + WalletConnect + Hyperliquid SDK
- **Automation**: n8n + Dify
- **Infra**: Coolify + Cloudflare + Hetzner（移行予定）

## データソース（9 種統合・月次 $19 のみ）
| カテゴリ | ソース | コスト |
|---------|-------|-------|
| 価格・MC | CoinGecko Demo | $0 |
| VC（アジア特化）| RootData API | 要申請 |
| VC（全般）| DeFiLlama Raises | $0 |
| IDO/トークノミクス | **CryptoRank Basic** | **$19/月** |
| トークンアンロック | Tokenomist.ai | 要交渉 |
| プロトコル収益 | Token Terminal | $0（月 50 万 req） |
| DeFi TVL | DeFiLlama | $0 |
| DEX 流動性 | DEXScreener | $0 |
| デリバティブ | Hyperliquid API | $0 |

## ドキュメント
- [`CLAUDE.md`](./CLAUDE.md) — プロジェクト全体設計（11 章・壁打ち反映版）
- [`Task.md`](./Task.md) — 作業キュー（M0-M12+ ロードマップ）

## License
Private — Paradigm LLC. All rights reserved.
