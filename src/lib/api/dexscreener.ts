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

/**
 * Return the single highest-liquidity DEX pair across chains for a symbol query.
 * Used by the coin detail page to determine which pair to chart and which
 * priceUsd to surface in the hero (DEX-only tokens have no CoinGecko price).
 *
 * Strategy:
 *   1. /search?q=<symbol>
 *   2. filter pairs where baseToken.symbol === query (case insensitive)
 *   3. sort by liquidity.usd desc
 *   4. return the top result, or null if none
 */
export async function getMostLiquidPair(symbolOrAddress: string): Promise<DsPair | null> {
  try {
    const { pairs } = await searchPairs(symbolOrAddress);
    if (!pairs?.length) return null;
    const exact = pairs.filter(
      (p) => p.baseToken.symbol.toLowerCase() === symbolOrAddress.toLowerCase(),
    );
    const pool = exact.length > 0 ? exact : pairs;
    const sorted = [...pool].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
    return sorted[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Top N pairs by liquidity for an arbitrary symbol/address. Used by the
 * DEX panel on coin detail pages and by the /dex aggregate page.
 */
export async function getTopPairs(symbolOrAddress: string, limit = 10): Promise<DsPair[]> {
  try {
    const { pairs } = await searchPairs(symbolOrAddress);
    if (!pairs?.length) return [];
    const exact = pairs.filter((p) => p.baseToken.symbol.toLowerCase() === symbolOrAddress.toLowerCase());
    const pool = exact.length > 0 ? exact : pairs;
    return [...pool]
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Trending pairs (5m volume surge) — useful for /dex hot list.
 */
export async function getTrendingPairs(chainId?: string): Promise<DsPair[]> {
  try {
    // DexScreener's "trending" is implicit — we approximate by searching well-known
    // memecoin queries and ranking by 5m volume / liquidity ratio (volatility proxy).
    const seeds = chainId
      ? [chainId]
      : ['solana', 'base', 'arbitrum', 'ethereum', 'bsc'];
    const all: DsPair[] = [];
    for (const seed of seeds) {
      const { pairs } = await searchPairs(seed).catch(() => ({ pairs: [] as DsPair[] }));
      all.push(...pairs);
    }
    // Filter for non-stable trading pairs with >$100K liquidity
    const filtered = all.filter(
      (p) =>
        (p.liquidity?.usd ?? 0) > 100_000 &&
        p.volume.h24 > 50_000 &&
        !/usd[ct]?|dai|fei|frax/i.test(p.baseToken.symbol),
    );
    // Score by 24h volume / liquidity (turnover)
    return [...filtered]
      .sort((a, b) => b.volume.h24 / (b.liquidity?.usd ?? 1) - a.volume.h24 / (a.liquidity?.usd ?? 1))
      .slice(0, 50);
  } catch {
    return [];
  }
}
