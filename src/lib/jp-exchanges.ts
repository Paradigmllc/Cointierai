/**
 * 日本国内取引所マッピング (Notion L1723-1728)
 *
 * 「この銘柄は国内取引所で買えるか」を一発判定する。
 * 競合 (CoinGecko / CryptoRank / Messari) が持たない日本特化情報。
 *
 * Notion 設計書: 日本人投資家が最初に見る情報 = 最強の差別化
 */

import type { Coin } from '@/types/database';

export const JP_EXCHANGES = [
  { id: 'bitflyer',        name: 'bitFlyer',          fsa: true,  url: 'https://bitflyer.com' },
  { id: 'coincheck',       name: 'Coincheck',         fsa: true,  url: 'https://coincheck.com' },
  { id: 'gmo-coin',        name: 'GMO コイン',         fsa: true,  url: 'https://coin.z.com' },
  { id: 'bitbank',         name: 'bitbank',           fsa: true,  url: 'https://bitbank.cc' },
  { id: 'sbi-vc',          name: 'SBI VC トレード',     fsa: true,  url: 'https://www.sbivc.co.jp' },
  { id: 'dmm-bitcoin',     name: 'DMM Bitcoin',       fsa: true,  url: 'https://bitcoin.dmm.com' },
  { id: 'rakuten-wallet',  name: '楽天ウォレット',       fsa: true,  url: 'https://www.rakuten-wallet.co.jp' },
  { id: 'huobi-japan',     name: 'Huobi Japan',       fsa: true,  url: 'https://www.huobi.co.jp' },
  { id: 'kucoin-jp',       name: 'KuCoin Japan',      fsa: true,  url: 'https://kucoin.jp' },
] as const;

/**
 * 国内取引所での取扱状況を確認 (シンプルなシンボルベース判定)
 *
 * 実運用では coin_exchanges テーブルを join するのが理想だが、
 * 主要銘柄は静的マップで即判定する (UI レスポンス優先)
 */
const JP_EXCHANGE_LISTINGS: Record<string, string[]> = {
  // BTC は全 9 取引所が扱う
  bitcoin: ['bitflyer', 'coincheck', 'gmo-coin', 'bitbank', 'sbi-vc', 'dmm-bitcoin', 'rakuten-wallet', 'huobi-japan', 'kucoin-jp'],
  ethereum: ['bitflyer', 'coincheck', 'gmo-coin', 'bitbank', 'sbi-vc', 'dmm-bitcoin', 'rakuten-wallet', 'huobi-japan'],
  ripple: ['bitflyer', 'coincheck', 'gmo-coin', 'bitbank', 'sbi-vc', 'dmm-bitcoin', 'rakuten-wallet'],
  litecoin: ['bitflyer', 'coincheck', 'gmo-coin', 'bitbank', 'dmm-bitcoin'],
  'bitcoin-cash': ['bitflyer', 'coincheck', 'gmo-coin', 'bitbank', 'dmm-bitcoin'],
  cardano: ['bitflyer', 'coincheck', 'gmo-coin', 'sbi-vc'],
  solana: ['bitflyer', 'coincheck', 'gmo-coin', 'sbi-vc'],
  polkadot: ['bitflyer', 'coincheck', 'gmo-coin', 'bitbank', 'sbi-vc'],
  chainlink: ['coincheck', 'gmo-coin', 'bitbank', 'sbi-vc'],
  'shiba-inu': ['coincheck', 'gmo-coin', 'sbi-vc'],
  dogecoin: ['coincheck', 'gmo-coin', 'sbi-vc'],
  'avalanche-2': ['coincheck', 'gmo-coin', 'sbi-vc'],
  'matic-network': ['coincheck', 'gmo-coin', 'bitbank'],
  'binancecoin': [], // 国内未上場
};

export interface JpExchangeAvailability {
  symbol: string;
  jp_exchanges: typeof JP_EXCHANGES[number][];
  is_available_in_japan: boolean;
  count: number;
}

export function getJpAvailability(coin: Pick<Coin, 'id' | 'symbol'>): JpExchangeAvailability {
  const listings = JP_EXCHANGE_LISTINGS[coin.id] ?? [];
  const jp_exchanges = JP_EXCHANGES.filter((e) => listings.includes(e.id));
  return {
    symbol: coin.symbol,
    jp_exchanges,
    is_available_in_japan: listings.length > 0,
    count: listings.length,
  };
}
