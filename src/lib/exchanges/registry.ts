/**
 * Exchange registry — classifies CoinGecko market.identifier as CEX vs DEX,
 * maps it to a Cointier affiliate code (used by /go/[code]) when one exists,
 * and exposes a curated logo URL.
 *
 * Affiliate codes are resolved via Supabase `affiliate_links.code` at render
 * time — this map only declares the *expected* code so the UI can construct
 * `/go/[code]?coin={symbol}` links. If the row is inactive or missing the
 * /go route falls back to the partner's site root.
 */

export type ExchangeKind = 'cex' | 'dex' | 'aggregator';

interface ExchangeMeta {
  /** Display name override (CoinGecko's `market.name` is usually fine). */
  name?: string;
  kind: ExchangeKind;
  /** Region restrictions to flag in the UI. */
  region?: 'global' | 'jp' | 'kr' | 'us' | 'eu' | 'asia';
  /** Cointier affiliate code (matches affiliate_links.code). */
  affiliate?: string;
  /** Logo from a stable CDN — falls back to CoinGecko's market.logo when absent. */
  logo?: string;
  /** Country regulator warning flag (Japan). */
  jpfsaWarned?: boolean;
}

const REGISTRY: Record<string, ExchangeMeta> = {
  // ------------------- Tier 1 international CEX -------------------
  binance: { kind: 'cex', region: 'global', jpfsaWarned: true },
  binance_us: { kind: 'cex', region: 'us' },
  gdax: { name: 'Coinbase', kind: 'cex', region: 'us', affiliate: 'coinbase' },
  coinbase_exchange: { name: 'Coinbase', kind: 'cex', region: 'us', affiliate: 'coinbase' },
  kraken: { kind: 'cex', region: 'global', affiliate: 'kraken' },
  bitstamp: { kind: 'cex', region: 'eu' },
  bitfinex: { kind: 'cex', region: 'global' },
  gemini: { kind: 'cex', region: 'us' },

  // ------------------- Asia-focused CEX (Cointier core affiliate partners) -------------------
  bingx: { kind: 'cex', region: 'global', affiliate: 'bingx' },
  mxc: { name: 'MEXC', kind: 'cex', region: 'global', affiliate: 'mexc', jpfsaWarned: true },
  mexc: { kind: 'cex', region: 'global', affiliate: 'mexc', jpfsaWarned: true },
  bitget: { kind: 'cex', region: 'global', affiliate: 'bitget', jpfsaWarned: true },
  kucoin: { kind: 'cex', region: 'global', affiliate: 'kucoin', jpfsaWarned: true },
  okex: { name: 'OKX', kind: 'cex', region: 'global', jpfsaWarned: true },
  bybit_spot: { name: 'Bybit', kind: 'cex', region: 'global', jpfsaWarned: true },
  htx: { kind: 'cex', region: 'global', jpfsaWarned: true },
  gate: { kind: 'cex', region: 'global', jpfsaWarned: true },
  hashkey: { kind: 'cex', region: 'asia', affiliate: 'hashkey' },

  // ------------------- Japan domestic (金融庁届出済) -------------------
  bitflyer: { kind: 'cex', region: 'jp', affiliate: 'bitflyer' },
  coincheck: { kind: 'cex', region: 'jp', affiliate: 'coincheck' },
  bitbank: { kind: 'cex', region: 'jp', affiliate: 'bitbank' },
  gmo_japan: { name: 'GMO Coin', kind: 'cex', region: 'jp', affiliate: 'gmo' },
  sbi_vc_trade: { kind: 'cex', region: 'jp', affiliate: 'sbi_vc' },
  dmm_japan: { name: 'DMM Bitcoin', kind: 'cex', region: 'jp' },
  rakuten: { kind: 'cex', region: 'jp' },
  huobi_japan: { kind: 'cex', region: 'jp' },
  kucoin_japan: { kind: 'cex', region: 'jp' },

  // ------------------- Korea -------------------
  upbit: { kind: 'cex', region: 'kr' },
  bithumb: { kind: 'cex', region: 'kr' },
  korbit: { kind: 'cex', region: 'kr' },

  // ------------------- SE Asia / India -------------------
  indodax: { kind: 'cex', region: 'asia' },
  tokocrypto: { kind: 'cex', region: 'asia' },
  coindcx: { kind: 'cex', region: 'asia', affiliate: 'coindcx' },
  wazirx: { kind: 'cex', region: 'asia' },
  coins_ph: { kind: 'cex', region: 'asia' },
  pdax: { kind: 'cex', region: 'asia' },

  // ------------------- DEX (Ethereum) -------------------
  uniswap_v3: { name: 'Uniswap v3', kind: 'dex' },
  uniswap_v2: { name: 'Uniswap v2', kind: 'dex' },
  uniswap_v4: { name: 'Uniswap v4', kind: 'dex' },
  sushiswap: { kind: 'dex' },
  curve: { kind: 'dex' },
  balancer_ethereum: { name: 'Balancer', kind: 'dex' },
  '0x_protocol': { name: '0x Protocol', kind: 'aggregator' },
  '1inch': { name: '1inch', kind: 'aggregator' },
  paraswap: { kind: 'aggregator' },

  // ------------------- DEX (BSC) -------------------
  pancakeswap_new: { name: 'PancakeSwap', kind: 'dex' },
  pancakeswap_v3: { name: 'PancakeSwap v3', kind: 'dex' },
  pancakeswap_v2: { name: 'PancakeSwap v2', kind: 'dex' },

  // ------------------- DEX (Solana) -------------------
  raydium: { kind: 'dex' },
  raydium2: { name: 'Raydium', kind: 'dex' },
  orca: { kind: 'dex' },
  jupiter_exchange: { name: 'Jupiter', kind: 'aggregator' },
  jupiter_exchange_solana: { name: 'Jupiter', kind: 'aggregator' },

  // ------------------- DEX (perps) -------------------
  dydx: { kind: 'dex' },
  dydx_v4: { name: 'dYdX v4', kind: 'dex' },
  gmx: { kind: 'dex' },
  hyperliquid: { kind: 'dex', region: 'global' },
};

export function classify(identifier: string): ExchangeKind {
  return REGISTRY[identifier]?.kind ?? 'cex';
}

export function exchangeMeta(identifier: string): ExchangeMeta {
  return REGISTRY[identifier] ?? { kind: 'cex' };
}

export function affiliateCodeFor(identifier: string): string | undefined {
  return REGISTRY[identifier]?.affiliate;
}

export function jpFsaWarned(identifier: string): boolean {
  return REGISTRY[identifier]?.jpfsaWarned === true;
}
