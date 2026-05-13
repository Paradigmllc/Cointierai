/**
 * Locale-aware "local exchanges" registry.
 *
 * Each locale resolves to a region (ja → JP, ko → KR, …) and we surface that
 * region's regulated / commonly-used exchanges. Availability per coin is
 * computed live from the CoinGecko ticker list — when the user's region has
 * a ticker for the coin, we light up the matching exchange tile.
 *
 * For `en` we fall back to a "Global majors" set so non-Asia visitors still
 * see something useful instead of a JP-only block.
 */

export type Region = 'JP' | 'KR' | 'TH' | 'VN' | 'ID' | 'TW' | 'GLOBAL';

export interface LocalExchange {
  /** CoinGecko market.identifier (so we can match against tickers without translation). */
  cgId: string;
  /** Display name. */
  name: string;
  /** Official site (homepage). */
  url: string;
  /** Whether the exchange holds a registration in its home market. */
  regulated?: boolean;
}

/**
 * Per-region curated lists. Ordered by domestic prominence. cgId must match
 * CoinGecko's market.identifier exactly so `tickers.some(t => t.market.identifier === cgId)`
 * does the right thing.
 */
export const LOCAL_EXCHANGES_BY_REGION: Record<Region, LocalExchange[]> = {
  JP: [
    { cgId: 'bitflyer', name: 'bitFlyer', url: 'https://bitflyer.com', regulated: true },
    { cgId: 'coincheck', name: 'Coincheck', url: 'https://coincheck.com', regulated: true },
    { cgId: 'gmo_japan', name: 'GMO Coin', url: 'https://coin.z.com', regulated: true },
    { cgId: 'bitbank', name: 'bitbank', url: 'https://bitbank.cc', regulated: true },
    { cgId: 'sbi_vc_trade', name: 'SBI VC Trade', url: 'https://www.sbivc.co.jp', regulated: true },
    { cgId: 'dmm_japan', name: 'DMM Bitcoin', url: 'https://bitcoin.dmm.com', regulated: true },
    { cgId: 'rakuten', name: 'Rakuten Wallet', url: 'https://www.rakuten-wallet.co.jp', regulated: true },
    { cgId: 'huobi_japan', name: 'Huobi Japan', url: 'https://www.huobi.co.jp', regulated: true },
    { cgId: 'kucoin_japan', name: 'KuCoin Japan', url: 'https://kucoin.jp', regulated: true },
  ],
  KR: [
    { cgId: 'upbit', name: 'Upbit', url: 'https://upbit.com', regulated: true },
    { cgId: 'bithumb', name: 'Bithumb', url: 'https://www.bithumb.com', regulated: true },
    { cgId: 'korbit', name: 'Korbit', url: 'https://www.korbit.co.kr', regulated: true },
    { cgId: 'coinone', name: 'Coinone', url: 'https://coinone.co.kr', regulated: true },
    { cgId: 'gopax', name: 'GOPAX', url: 'https://www.gopax.co.kr', regulated: true },
  ],
  TH: [
    { cgId: 'bitkub', name: 'Bitkub', url: 'https://www.bitkub.com', regulated: true },
    { cgId: 'satang_pro', name: 'Satang Pro', url: 'https://satangcorp.com', regulated: true },
    { cgId: 'zipmex', name: 'Zipmex', url: 'https://zipmex.com' },
    { cgId: 'upbit_thailand', name: 'Upbit Thailand', url: 'https://th.upbit.com', regulated: true },
  ],
  VN: [
    { cgId: 'onus', name: 'ONUS', url: 'https://goonus.io' },
    { cgId: 'remitano', name: 'Remitano', url: 'https://remitano.com' },
    { cgId: 'binance_p2p_vnd', name: 'Binance P2P (VND)', url: 'https://p2p.binance.com' },
  ],
  ID: [
    { cgId: 'indodax', name: 'Indodax', url: 'https://indodax.com', regulated: true },
    { cgId: 'tokocrypto', name: 'Tokocrypto', url: 'https://www.tokocrypto.com', regulated: true },
    { cgId: 'pintu', name: 'Pintu', url: 'https://pintu.co.id', regulated: true },
    { cgId: 'reku', name: 'Reku', url: 'https://reku.id', regulated: true },
    { cgId: 'triv', name: 'Triv', url: 'https://triv.co.id', regulated: true },
  ],
  TW: [
    { cgId: 'max', name: 'MAX Exchange', url: 'https://max.maicoin.com', regulated: true },
    { cgId: 'bitopro', name: 'BitoPro', url: 'https://www.bitopro.com', regulated: true },
    { cgId: 'ace', name: 'ACE Exchange', url: 'https://ace.io' },
    { cgId: 'rybit', name: 'Rybit', url: 'https://rybit.com' },
  ],
  GLOBAL: [
    { cgId: 'gdax', name: 'Coinbase', url: 'https://www.coinbase.com', regulated: true },
    { cgId: 'kraken', name: 'Kraken', url: 'https://www.kraken.com', regulated: true },
    { cgId: 'bitstamp', name: 'Bitstamp', url: 'https://www.bitstamp.net', regulated: true },
    { cgId: 'gemini', name: 'Gemini', url: 'https://www.gemini.com', regulated: true },
    { cgId: 'bitfinex', name: 'Bitfinex', url: 'https://www.bitfinex.com' },
    { cgId: 'binance_us', name: 'Binance.US', url: 'https://www.binance.us', regulated: true },
  ],
};

const LOCALE_TO_REGION: Record<string, Region> = {
  ja: 'JP',
  ko: 'KR',
  th: 'TH',
  vi: 'VN',
  id: 'ID',
  'zh-TW': 'TW',
  en: 'GLOBAL',
};

export function regionForLocale(locale: string): Region {
  return LOCALE_TO_REGION[locale] ?? 'GLOBAL';
}

export function localExchangesForLocale(locale: string): LocalExchange[] {
  return LOCAL_EXCHANGES_BY_REGION[regionForLocale(locale)] ?? LOCAL_EXCHANGES_BY_REGION.GLOBAL;
}

/** Heading label per locale — translated, regulator framing where applicable. */
export const HEADING_BY_LOCALE: Record<string, { heading: string; subline: string; flag: string }> = {
  ja: { heading: '国内取引所での取扱', subline: '金融庁届出済の国内取引所での取扱状況です。投資推奨ではなく、利用可能性の情報です。', flag: '🇯🇵' },
  ko: { heading: '국내 거래소 상장 현황', subline: '금융위 신고 완료 거래소에서의 상장 현황입니다. 투자 권유가 아닙니다.', flag: '🇰🇷' },
  th: { heading: 'ตลาดในประเทศที่รองรับ', subline: 'ตลาดในประเทศไทยที่ได้รับใบอนุญาตจาก SEC ไม่ใช่คำแนะนำการลงทุน', flag: '🇹🇭' },
  vi: { heading: 'Sàn giao dịch trong nước', subline: 'Trạng thái niêm yết trên các sàn giao dịch tại Việt Nam. Không phải lời khuyên đầu tư.', flag: '🇻🇳' },
  id: { heading: 'Bursa lokal yang mendukung', subline: 'Status pendaftaran di bursa kripto terdaftar BAPPEBTI. Bukan saran investasi.', flag: '🇮🇩' },
  'zh-TW': { heading: '國內交易所掛牌情況', subline: '台灣國內交易所的掛牌情形。本資訊僅供參考,不構成投資建議。', flag: '🇹🇼' },
  en: { heading: 'Global majors', subline: 'Major regulated exchanges available globally. Not investment advice.', flag: '🌐' },
};

export function localExchangesHeading(locale: string) {
  return HEADING_BY_LOCALE[locale] ?? HEADING_BY_LOCALE.en;
}
