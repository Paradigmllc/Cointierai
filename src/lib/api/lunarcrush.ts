/**
 * LunarCRUSH API client
 *
 * Social sentiment & community engagement (無料枠あり・帰属表示で使用可)
 * Pattern B 個人投資家向け Tier 評価で「community」軸の主要シグナル。
 */

const BASE = 'https://lunarcrush.com/api4/public';
const API_KEY = process.env.LUNARCRUSH_API_KEY;

async function lcFetch<T>(path: string): Promise<T> {
  if (!API_KEY) {
    console.warn('[lunarcrush] LUNARCRUSH_API_KEY is not set, skipping');
    return null as unknown as T;
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30_000),
    next: { revalidate: 1800 }, // 30min
  });
  if (!res.ok) {
    throw new Error(`LunarCRUSH ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export interface LcCoin {
  id: number;
  symbol: string;
  name: string;
  price: number;
  volume_24h: number;
  market_cap: number;
  // Social signals
  galaxy_score: number;        // 0-100 総合スコア
  alt_rank: number;             // 全銘柄中のソーシャルランク
  social_volume_24h: number;
  social_score_24h: number;
  social_contributors: number;  // 投稿者数
  social_dominance: number;
  sentiment: number;            // 1-5 (1=very bearish, 5=very bullish)
  posts_active: number;
  interactions_24h: number;
}

export async function getCoins(): Promise<{ data: LcCoin[] }> {
  return lcFetch('/coins/list/v1');
}

export async function getCoin(symbol: string): Promise<{ data: LcCoin }> {
  return lcFetch(`/coins/${symbol}/v1`);
}
