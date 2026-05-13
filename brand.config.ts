/**
 * brand.config.ts — 横展開のためのブランド設定
 *
 * このファイルだけ書き換えれば、Cointier (crypto) →
 * Stocktier (stocks) / NftTier (NFT) など別ジャンルへ展開可能。
 *
 * 横展開計画 (RR ルール準拠):
 *   - cointier.ai  (crypto)   ← 本実装
 *   - stocktier.ai (株式)     ← 同アーキテクチャ・データソース差替
 *   - nfttier.ai   (NFT)      ← 同アーキテクチャ・データソース差替
 *   - cointier 内の Tier 算出ロジックを @paradigmllc/tier-evaluator npm 化
 *
 * 環境変数で更にオーバーライド可能 (deploy 環境別に切替)。
 */

export const BRAND = {
  // ====== 基本情報 ======
  name: 'Cointier',
  shortName: 'Cointier',
  legalName: 'Paradigm LLC',
  domain: 'cointier.ai',
  defenseDomains: ['cointier.io', 'cointier.co'],

  // ====== タグライン / 説明 ======
  tagline: {
    ja: 'アジア発、AI で読み解くクリプト市場',
    en: "Asia's AI-Powered Crypto Intelligence",
  },
  description: {
    ja: '全 37,000+ 暗号資産を AI が分析・7 言語提供する次世代インテリジェンスプラットフォーム',
    en: 'AI-analyzed insights on 37,000+ cryptocurrencies in 7 Asian languages',
  },

  // ====== 業界・対象 ======
  industry: 'cryptocurrency',     // 'cryptocurrency' / 'stocks' / 'nft' / 'startup'
  targetAudience: 'asia-retail',  // 'asia-retail' / 'global-institutional' / 'b2b'

  // ====== 取り扱い銘柄数想定 ======
  expectedAssetCount: 37_000,

  // ====== Tier 評価ロジック (Pattern B 個人投資家向け) ======
  tierPattern: 'B',
  tierWeights: {
    liquidity: 0.10,
    team: 0.15,
    technology: 0.15,
    community: 0.25,
    regulatory: 0.10,
    future: 0.25,
  },
  tierThresholds: { S: 80, A: 65, B: 50, C: 35, D: 20, F: 0 },

  // ====== LLM 設定 ======
  llmTone: 'neutral-educator',    // 'neutral-educator' / 'institutional' / 'critic'
  llmDefaultModel: 'deepseek/deepseek-v4-pro',
  llmVisionModel: 'google/gemini-2.5-flash',

  // ====== カラー (CryptoRank.io 風ダーク) ======
  colors: {
    background: '#0B0E16',
    card: '#171B25',
    primary: '#3B82F6',
    gain: '#16C784',
    loss: '#EA3943',
    tier: {
      S: '#FFD700',
      A: '#C0C0C0',
      B: '#CD7F32',
      C: '#9CA3AF',
      D: '#FB923C',
      F: '#EF4444',
    },
  },

  // ====== 料金プラン ======
  pricing: {
    pro: { monthly: 1980, yearly: 16800, currency: 'JPY' },
    business: { monthly: 9800, yearly: 88200, currency: 'JPY' },
  },

  // ====== 主要 affiliate (industry によって差替) ======
  affiliates: [
    { id: 'bingx',     priority: 'primary',   label: 'BingX',   url: 'https://bingx.com' },
    { id: 'mexc',      priority: 'secondary', label: 'MEXC',    url: 'https://mexc.com' },
    { id: 'bitget',    priority: 'tertiary',  label: 'Bitget',  url: 'https://bitget.com' },
  ],

  // ====== SNS ======
  social: {
    twitter: 'cointier',
    medium: '@cointier',
    github: 'Paradigmllc/Cointierai',
  },
} as const;

export type BrandConfig = typeof BRAND;
