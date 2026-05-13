# Cointier — 手動セットアップ手順

> セッションの実装は ✅ 完了済. このファイルは **ブラウザ/UI でしか実行できない手動作業** だけを集約.

---

## 1. 🔴 必須 (サイト動作に直接影響)

### 1-1. Supabase `cointier` schema を PostgREST で公開

cointier の全テーブルは `appexx-studio` プロジェクトの `cointier` schema 配下に schema isolation で配置されている. 当初 PostgREST は `public` schema しか公開しないため、API 経由 (Supabase JS client) でクエリすると 404 になる.

**手順 (5 分)**:
1. https://supabase.com/dashboard/project/yihdmgtxiqfdgdueolub/settings/api を開く
2. **Exposed schemas** 欄で `public` の隣に `cointier` を追加
3. **Save** クリック
4. 1-2 分で PostgREST が再起動し公開される
5. 確認: `curl https://yihdmgtxiqfdgdueolub.supabase.co/rest/v1/coins -H "apikey: <ANON_KEY>" -H "Accept-Profile: cointier"` で 200 + JSON が返れば OK

未実行の場合のシンプトム: `/ja/coins` などのページがロードはするが空配列 `[]` → CoinGecko fallback が動く (動作する) が DB-first 設計の効果が出ない.

### 1-2. CoinGecko Demo API key 取得 + Coolify 環境変数登録

CoinGecko の Free tier は 30 calls/min・10K calls/月. ingestion (17K coins × 多時刻) に必須.

**手順 (5 分)**:
1. https://www.coingecko.com/en/api/pricing → **Demo (Free)** プランで登録
2. ダッシュボードで API key 取得 (`CG-XXXXXXXXXXXXXX` 形式)
3. https://coolify.appexx.me/projects/.../applications/ao5dx27lbmt97el0xss1kvrw → **Environment Variables** タブ
4. 新規追加: `COINGECKO_API_KEY` = (取得した key)
5. Redeploy (or wait for auto-redeploy on env change)

未実行の場合: 価格・市場データが取得できず Top coins が空のまま.

### 1-3. 管理画面 (ADMIN_EMAILS) 登録

`/admin/*` への access はメール allowlist で gate. ADMIN_EMAILS が未設定だと **誰も** 管理画面に入れない.

**手順 (1 分)**:
1. Coolify env vars に `ADMIN_EMAILS` = `apple.info.9124@gmail.com` (自分のメール) を追加
   - 複数メール対応: カンマ区切り (例: `apple.info.9124@gmail.com,founder@paradigm.com`)
2. Redeploy
3. https://cointier.ai/admin にログイン → 自分のメールで Magic Link 認証 → 管理画面 access

未実行の場合: `/admin/*` 全ページが `403 forbidden`.

---

## 2. 🟠 推奨 (機能拡張)

### 2-1. CryptoRank Basic 契約 ($19/月)

VC 投資家データ・トークノミクス unlock data の最も完全なソース.

- https://cryptorank.io/api → Basic plan
- Coolify env: `CRYPTORANK_API_KEY`
- `npm run ingest:cryptorank` で実行

### 2-2. RootData API 申請

アジア VC ファンド・portfolio 関係 (差別化軸の最大の武器).

- https://rootdata.com/Api → 申請フォーム
- 承認まで 1-2 週間
- Coolify env: `ROOTDATA_API_KEY`

### 2-3. Token Terminal API (無料 50 万 req/月)

PE/PS/PF ratio などのファンダメンタル指標.

- https://tokenterminal.com/ → アカウント登録 → API 設定
- Coolify env: `TOKEN_TERMINAL_API_KEY`

### 2-4. LunarCRUSH Bearer Token (無料枠あり)

Social signal (Galaxy Score / Alt Rank) — Pattern B Tier 計算の community weight に使用.

- https://lunarcrush.com/developers → 無料枠申請
- Coolify env: `LUNARCRUSH_API_KEY`

### 2-5. Tokenomist 交渉 (or DeFiLlama Unlocks fallback)

- Tokenomist は要交渉. 当面は DeFiLlama Unlocks API で fallback (実装済)
- 後ほど Tokenomist 直接契約に差し替え

---

## 3. 🟡 ドメイン・本番化

### 3-1. ドメイン取得

**推奨**: Porkbun (安価・WhoisGuard 標準) で以下 3 ドメインを bulk 取得:

- `cointier.ai` (主)
- `cointier.com` (defensive)
- `cointier.io` (defensive)

### 3-2. DNS 設定 (Cloudflare)

1. Cloudflare で `cointier.ai` zone 作成
2. ネームサーバーを Porkbun から Cloudflare に切替
3. A record: `@` → `139.59.250.5` (Coolify host)
4. CNAME record: `www` → `cointier.ai`
5. Coolify Application の **Domains** タブで `cointier.ai` 追加 → Let's Encrypt 自動取得

### 3-3. 商標調査 (J-PlatPat)

- https://www.j-platpat.inpit.go.jp/ → 「cointier」「コインティア」「コインティアー」検索
- 出願人とジャンル (役務区分: 36 / 42 / 35 等) 確認
- 必要なら出願 (約 ¥30,000 = 区分1 つ・申請料 + 登録料)

---

## 4. 🟢 後続フェーズ (M2-M4 で対応)

| 項目 | 時期 | 内容 |
|------|------|------|
| Hyperliquid Builder address 登録 | M2 | オンチェーン登録 (Builder Fee 課金開始) |
| Stripe 契約 + Pricing 公開 | M2 | Pro ¥1,980/月 → 課金フロー有効化 |
| n8n 定期 ingestion cron | M2 | `npm run ingest:all` を 30 分毎に自動実行 |
| Privy 統合 (M3 で再導入) | M3 | メール/SNS ログイン → ウォレット自動生成 — **再 install 時に互換バージョン pin 注意** (M0 で内部 Solana 依存破綻のため除外) |
| Polymarket Verified Builder | M3 | 予測マーケット手数料 share |
| Capacitor アプリ化 | M3-M4 | iOS/Android ストア申請 |
| 被リンク Tier S 一斉確保 | M1 | GitHub / npm / LinkedIn / Medium / Zenn / Qiita / note / Reddit |

---

## 5. 🔄 デプロイ確認チェックリスト

毎回のデプロイ後に確認 (T-PLUS ルール):

1. ✅ Coolify deploy status = `finished`
2. ✅ `curl -I http://ao5dx27lbmt97el0xss1kvrw.139.59.250.5.sslip.io/ja` で `200 OK`
3. ✅ ブラウザで `/ja` を開いて hero + Tier Badge + Ticker Tape が表示される
4. ✅ `/admin` ログイン → KPI ダッシュボード表示
5. ✅ `/admin/affiliate-links/new` でフォーム送信 → DB に row 作成
6. ✅ `/go/[code]` リンクで partner URL へ redirect + cookie `_ctr_sess` がブラウザに set
7. ✅ Slack `#all-paradigm` に「Cointier デプロイ完了」通知届く (N ルール)
