# cointierai

> AI-powered cryptocurrency tier rating platform — Moody's / S&P for crypto.

[![Status](https://img.shields.io/badge/status-design_phase-yellow)](./CLAUDE.md)
[![License](https://img.shields.io/badge/license-private-red)]()

## 概要

全暗号資産（20,000+ 銘柄）を AI が **S / A / B / C / D / F の 6 段階で自動格付け** するプラットフォーム。6 軸（流動性 / チーム / テクノロジー / コミュニティ / 規制リスク / 将来性）で評価し、リアルタイムに再評価。

## ステータス

**🚧 設計フェーズ（M0）** — CLAUDE.md / Task.md 初期版生成済み。壁打ち未完。

詳細は [`CLAUDE.md`](./CLAUDE.md) と [`Task.md`](./Task.md) を参照。

## 主な技術スタック（予定）

- Next.js 15 + TypeScript + Tailwind + shadcn/ui
- Supabase (Postgres + RLS) + PayloadCMS
- DeepSeek V4 Pro (Context Cache) + Dify + n8n
- Stripe / Coolify / Cloudflare

## ロードマップ

| フェーズ | 期間 | 完了条件 |
|---------|------|---------|
| M0 設計 | 2026-05 | CLAUDE.md 確定 |
| M1 MVP | 2026-06〜07 | Top 100 銘柄・Free プラン公開 |
| M2 pSEO | 2026-08〜10 | 月間 10 万 PV / Pro リリース |
| M3 Enterprise | 2026-11〜2027-01 | 機関 5 社契約 |
| M4 API/MCP/x402 | 2027-02〜 | AI エージェント自動課金 |

## License

Private — Paradigm LLC. All rights reserved.
