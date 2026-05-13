import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 設定 (Notion L1438-1456)
 *
 * Next.js コードを 90%+ 流用してアプリ化
 * M3-M4 で `npx cap add ios && npx cap add android` 実行
 *
 * 開発期間: Web 完成後 +2-3 週間
 */
const config: CapacitorConfig = {
  appId: 'ai.cointier.app',
  appName: 'Cointier',
  webDir: 'out',          // Next.js export 出力
  bundledWebRuntime: false,

  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // dev 時のみ live reload を有効にする
    cleartext: process.env.NODE_ENV !== 'production',
  },

  plugins: {
    PushNotifications: {
      // FCM (Android) / APNs (iOS)
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0B0E16',     // CryptoRank 風ダークカラー
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B0E16',
    },
    Keyboard: {
      resize: 'native',
      style: 'DARK',
    },
  },

  ios: {
    contentInset: 'always',
    backgroundColor: '#0B0E16',
  },
  android: {
    backgroundColor: '#0B0E16',
    allowMixedContent: false,
  },
};

export default config;
