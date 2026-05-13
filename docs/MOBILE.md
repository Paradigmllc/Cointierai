# Cointier Mobile App (Capacitor)

> Notion L1438-1456: Next.js コード 90%+ 流用で iOS/Android 化

## セットアップ手順

```bash
# 1. Capacitor 依存追加 (まだなら)
npm i -D @capacitor/cli @capacitor/core @capacitor/ios @capacitor/android
npm i @capacitor/push-notifications @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard

# 2. Next.js を static export 化
# next.config.mjs に `output: 'export'` を追加 (M3 段階で切替)

# 3. プラットフォーム追加
npx cap add ios
npx cap add android

# 4. ビルド + 同期
npm run build
npx cap sync

# 5. ネイティブ IDE で開く
npx cap open ios       # Xcode (要 macOS)
npx cap open android   # Android Studio
```

## ASO (App Store 最適化) — Notion L1480-1499

### アプリ名 / サブタイトル
- **EN**: Cointier - Asia Crypto Intelligence
- **JA**: Cointier - アジア発 AI クリプト分析
- **Subtitle (30 chars)**: VC・IDO・トークン分析

### キーワード (100 chars / 各 ASO 領域)
```
crypto,bitcoin,ethereum,DeFi,IDO,VC,token,unlock,hyperliquid,defi
```

### スクリーンショット 5 枚 (CVR 最重要)
1. 銘柄ダッシュボード (日本語・Tier 表示)
2. VC 資金調達一覧
3. トークンアンロックカレンダー
4. Hyperliquid 取引分析
5. プッシュ通知画面

### 多言語ストアページ
- 日本語 / 英語 / タイ語 / ベトナム語 (M3)
- インドネシア語 / 繁体字 / 韓国語 (M6)

## Push 通知設計 (Notion L1392-1397)

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// 起動時に登録
await PushNotifications.requestPermissions();
await PushNotifications.register();

PushNotifications.addListener('registration', ({ value }) => {
  // value = FCM/APNs token
  fetch('/api/push/register', {
    method: 'POST',
    body: JSON.stringify({ token: value }),
  });
});
```

## Builder Fee 承認率 (Notion L1465-1478)

| 環境 | 承認率 | 月収益 (1000 active users · $50K avg trade) |
|------|--------|----------|
| Web のみ | 15-20% | $700/月 |
| **アプリ** | **50-70%** | **$2,100/月** |

3-4 倍の収益差が生まれる。

## ロックイン 5 層 (Notion L1384-1415)

1. **データロックイン** — ウォッチリスト・ポートフォリオ・税務履歴
2. **通知ロックイン** — アンロックアラート (アプリ消すと届かない)
3. **取引履歴ロックイン** — Hyperliquid 履歴・確定申告データ
4. **Builder Fee ロックイン** — 一度承認で永続収益
5. **コミュニティロックイン** — Discord/Telegram 連携 (M6)
