/**
 * DEXScreener API client
 *
 * 完全無料・商用利用可・認証不要・300 req/分。
 * 80+ chains, 300+ DEX, 2M+ tokens.
 *
 * 用途:
 *   - 「この銘柄がどの DEX で取引可能か」表示
 *   - DEX 流動性データ
 *   - Long-tail token coverage (CoinGecko/CryptoRank に無い銘柄)
 */

const BASE = 'https://api.dexscreener.com/latest/dex';

async function dsFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Cointier/0.1' },
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`DEXScreener ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export interface DsPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string | null;
  txns: { m5: { buys: number; sells: number }; h1: { buys: number; sells: number }; h6: { buys: number; sells: number }; h24: { buys: number; sells: number } };
  volume: { h24: number; h6: number; h1: number; m5: number };
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  liquidity: { usd?: number; base: number; quote: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

/**
 * Token アドレスから関連する全 DEX ペアを取得
 */
export async function getPairsByToken(chainId: string, tokenAddress: string): Promise<{ pairs: DsPair[] }> {
  return dsFetch(`/tokens/${tokenAddress}`);
}

/**
 * ペアアドレスから詳細取得
 */
export async function getPair(chainId: string, pairAddress: string): Promise<{ pair: DsPair }> {
  return dsFetch(`/pairs/${chainId}/${pairAddress}`);
}

/**
 * 検索 (シンボル / 名前)
 */
export async function searchPairs(query: string): Promise<{ pairs: DsPair[] }> {
  return dsFetch(`/search/?q=${encodeURIComponent(query)}`);
}
