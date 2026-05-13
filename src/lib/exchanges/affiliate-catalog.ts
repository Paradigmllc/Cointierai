/**
 * Affiliate exchange catalog — single source of truth for ranked CTAs.
 *
 * Why: AffiliateCTA was getting a hard-coded list per-page. Centralising lets
 * us swap signup bonuses / commissions / region eligibility in one place and
 * still keep the /go/[code] redirect contract.
 *
 * Region eligibility flags (FSA = 金融庁) drive automatic CTA filtering:
 *   - For `region: 'ja'` locale users we hide exchanges with `fsaWarning=true`
 *     ("利用可能な取引所" only — regulatory-safe per CLAUDE.md §6).
 *   - Bonus / commission strings render as Tier badges next to the CTA.
 *
 * To add a new exchange: append here + add a row in Supabase `affiliate_links`
 * (migration 00004). The code MUST match an `affiliate_links.code`.
 */

export interface AffiliatePartner {
  /** Matches affiliate_links.code in Supabase. */
  code: string;
  label: string;
  /** Short marketing line (per-locale). */
  tagline: { en: string; ja: string };
  /** "5,000 USDT bonus" / "$6,200" — surfaced as a chip next to the CTA. */
  bonus?: { en: string; ja: string };
  /** "40% commission, 3 years" — for transparency badge on Tier S CTAs. */
  commission?: string;
  /** Country code(s) the exchange targets. Lowercase ISO 3166-1 alpha-2. */
  regions: ('global' | 'jp' | 'kr' | 'sg' | 'hk' | 'in' | 'th' | 'vn' | 'id' | 'tw' | 'ph')[];
  /** 金融庁警告対象 — hide for Japan-locale CTAs. */
  fsaWarning: boolean;
  /** S=highest priority CTA, A=secondary, B=fallback. */
  tier: 'S' | 'A' | 'B';
  /** Optional logo URL. */
  logo?: string;
}

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  // ===== Tier S — primary CTA =====
  {
    code: 'bingx',
    label: 'BingX',
    tagline: { en: 'Copy-trade · low fees · no FSA warning', ja: 'コピートレード対応・金融庁警告なし' },
    bonus: { en: 'Up to $4,500 sign-up bonus', ja: '最大 $4,500 サインアップボーナス' },
    commission: 'Fee-share lifetime',
    regions: ['global', 'jp', 'in', 'ph', 'sg', 'hk', 'th', 'vn', 'id'],
    fsaWarning: false,
    tier: 'S',
    logo: 'https://bin.bnbstatic.com/static/images/common/favicon.ico',
  },
  // ===== Tier A — strong global names =====
  {
    code: 'mexc',
    label: 'MEXC',
    tagline: { en: 'Earliest altcoin listings · 40% fee-share for 3y', ja: 'アルトコイン上場最速・手数料分配 40%・3年継続' },
    bonus: { en: 'Up to $9,000 bonus', ja: '最大 $9,000 ボーナス' },
    commission: '40% / 3 years',
    regions: ['global', 'jp', 'in', 'ph', 'sg', 'th', 'vn', 'id', 'tw'],
    fsaWarning: true,
    tier: 'A',
    logo: 'https://www.mexc.com/favicon.ico',
  },
  {
    code: 'bitget',
    label: 'Bitget',
    tagline: { en: 'Copy-trading leader · futures', ja: 'コピー取引最大手・先物充実' },
    bonus: { en: 'Up to $6,200 bonus', ja: '最大 $6,200 ボーナス' },
    regions: ['global', 'jp', 'in', 'sg', 'hk', 'vn', 'id'],
    fsaWarning: true,
    tier: 'A',
    logo: 'https://www.bitget.com/favicon.ico',
  },
  {
    code: 'kucoin',
    label: 'KuCoin',
    tagline: { en: 'Long-tail altcoin paradise', ja: '長尾アルトコイン豊富' },
    commission: 'Fee-share',
    regions: ['global', 'sg', 'in', 'ph', 'tw'],
    fsaWarning: true,
    tier: 'A',
    logo: 'https://www.kucoin.com/favicon.ico',
  },
  // ===== Asia regional =====
  {
    code: 'coindcx',
    label: 'CoinDCX',
    tagline: { en: 'India\'s largest crypto exchange', ja: 'インド最大の取引所' },
    regions: ['in'],
    fsaWarning: false,
    tier: 'S',
  },
  {
    code: 'wazirx',
    label: 'WazirX',
    tagline: { en: 'India · INR pairs', ja: 'インド・INR ペア' },
    regions: ['in'],
    fsaWarning: false,
    tier: 'A',
  },
  {
    code: 'coinsph',
    label: 'Coins.ph',
    tagline: { en: 'Philippines · PHP fiat ramps', ja: 'フィリピン・PHP 法定通貨' },
    regions: ['ph'],
    fsaWarning: false,
    tier: 'S',
  },
  {
    code: 'pdax',
    label: 'PDAX',
    tagline: { en: 'Philippines · BSP-regulated', ja: 'フィリピン中銀規制下' },
    regions: ['ph'],
    fsaWarning: false,
    tier: 'A',
  },
  {
    code: 'upbit',
    label: 'Upbit',
    tagline: { en: 'Korea · KRW pairs', ja: '韓国・KRW ペア' },
    regions: ['kr'],
    fsaWarning: false,
    tier: 'S',
  },
  {
    code: 'bithumb',
    label: 'Bithumb',
    tagline: { en: 'Korea · large KRW liquidity', ja: '韓国・KRW 流動性大' },
    regions: ['kr'],
    fsaWarning: false,
    tier: 'A',
  },
  {
    code: 'bitkub',
    label: 'Bitkub',
    tagline: { en: 'Thailand · SEC-licensed', ja: 'タイ・SEC ライセンス' },
    regions: ['th'],
    fsaWarning: false,
    tier: 'S',
  },
  {
    code: 'hashkey',
    label: 'HashKey',
    tagline: { en: 'Hong Kong · SFC Type 1 + 7', ja: '香港 SFC ライセンス' },
    regions: ['hk'],
    fsaWarning: false,
    tier: 'S',
  },
  {
    code: 'coinbase',
    label: 'Coinbase',
    tagline: { en: 'US public, listed brand', ja: '米国上場ブランド' },
    regions: ['global', 'sg', 'hk'],
    fsaWarning: false,
    tier: 'A',
  },
  {
    code: 'kraken',
    label: 'Kraken',
    tagline: { en: 'OG · staking · low spreads', ja: '老舗・低スプレッド・ステーキング' },
    regions: ['global', 'sg'],
    fsaWarning: false,
    tier: 'A',
  },
  // ===== Hardware wallets =====
  {
    code: 'ledger',
    label: 'Ledger',
    tagline: { en: 'Hardware wallet · self-custody', ja: 'ハードウェアウォレット・自己管理' },
    bonus: { en: '$10-20 per signup', ja: '$10-20 / 登録' },
    regions: ['global', 'jp', 'kr', 'in', 'ph', 'sg', 'hk', 'th', 'vn', 'id', 'tw'],
    fsaWarning: false,
    tier: 'A',
  },
  {
    code: 'trezor',
    label: 'Trezor',
    tagline: { en: 'Open-source hardware wallet', ja: 'OSS ハードウェアウォレット' },
    bonus: { en: '$10-15 per signup', ja: '$10-15 / 登録' },
    regions: ['global', 'jp', 'kr', 'in', 'ph', 'sg', 'hk', 'th', 'vn', 'id', 'tw'],
    fsaWarning: false,
    tier: 'B',
  },
];

/** Filter the catalog for a viewer in `locale`. Hides FSA-warned for Japan. */
export function selectAffiliates(locale: string): AffiliatePartner[] {
  const jpStrict = locale === 'ja';
  // Tier S first, then A, then B.
  return AFFILIATE_PARTNERS
    .filter((p) => !jpStrict || !p.fsaWarning || p.regions.includes('jp'))
    .filter((p) => {
      // Show globally-targeted exchanges + region-specific ones for the user.
      const userRegion = localeToRegion(locale);
      return p.regions.includes('global') || p.regions.includes(userRegion as never);
    })
    .sort((a, b) => {
      const order = { S: 0, A: 1, B: 2 } as const;
      return order[a.tier] - order[b.tier];
    });
}

export function localeToRegion(locale: string): string {
  switch (locale) {
    case 'ja': return 'jp';
    case 'ko': return 'kr';
    case 'th': return 'th';
    case 'vi': return 'vn';
    case 'id': return 'id';
    case 'zh-TW': return 'tw';
    default: return 'global';
  }
}
