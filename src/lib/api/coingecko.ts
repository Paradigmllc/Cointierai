/**
 * CoinGecko API client (Demo / Pro 兼用)
 *
 * 帰属表示必須 (BB ルール準拠 — 規約遵守):
 *   Footer 全 page で "Data provided by CoinGecko" 表示。
 *
 * 無料 Demo:
 *   - 月 10,000 call / 30 call/分
 *   - 17,000+ coins カバー
 *   - API key: x-cg-demo-api-key header
 */

const BASE = 'https://api.coingecko.com/api/v3';
const PRO_BASE = 'https://pro-api.coingecko.com/api/v3';

const API_KEY = process.env.COINGECKO_API_KEY;
const IS_PRO = process.env.COINGECKO_API_KEY_TIER === 'pro';

function endpoint(path: string): string {
  return `${IS_PRO ? PRO_BASE : BASE}${path}`;
}

function headers(): HeadersInit {
  const h: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'Cointier/0.1 (+https://cointier.ai)',
  };
  if (API_KEY) {
    h[IS_PRO ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key'] = API_KEY;
  }
  return h;
}

/**
 * 統一 fetch wrapper
 * - timeout 必須 (U ルール: AbortSignal.timeout)
 * - レート制限 429 時はリトライ
 */
async function cgFetch<T>(path: string, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(endpoint(path), {
        headers: headers(),
        signal: AbortSignal.timeout(30_000),
        next: { revalidate: 60 }, // ISR 1 min cache for SSR usage
      });
      if (res.status === 429) {
        const waitMs = 2_000 * attempt;
        console.warn(`[coingecko] 429 rate limit, retry ${attempt}/${retries} in ${waitMs}ms`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      if (!res.ok) {
        throw new Error(`CoinGecko ${res.status}: ${await res.text()}`);
      }
      return (await res.json()) as T;
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1_000 * attempt));
      }
    }
  }
  console.error('[coingecko] fetch failed after retries', { path, lastError });
  throw lastError;
}

// ============ Types ============
export interface CgCoinListItem {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>;
}

export interface CgMarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
  price_change_percentage_1y_in_currency?: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_date: string | null;
  last_updated: string;
  sparkline_in_7d?: { price: number[] };  // sparkline=true で取得時
}

export interface CgCoinDetail extends CgMarketCoin {
  description: { [locale: string]: string };
  links: {
    homepage: string[];
    whitepaper?: string;
    blockchain_site: string[];
    repos_url: { github: string[] };
    twitter_screen_name?: string;
    telegram_channel_identifier?: string;
    subreddit_url?: string;
    chat_url: string[];
  };
  categories: string[];
  market_data: Record<string, unknown>;
  community_data?: Record<string, unknown>;
  developer_data?: Record<string, unknown>;
  tickers?: Array<{ market: { identifier: string; name: string } }>;
}

export interface CgGlobalData {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

// ============ Endpoints ============

/**
 * 全 coin の id/symbol/name 一覧 (1 call で 17K+ 件)
 */
export async function getCoinList(): Promise<CgCoinListItem[]> {
  return cgFetch<CgCoinListItem[]>('/coins/list?include_platform=true');
}

/**
 * market 情報を時価総額順に取得 (page 単位)
 * per_page max = 250 (Demo) / 500 (Pro)
 */
export async function getMarkets(
  options: {
    page?: number;
    perPage?: number;
    vsCurrency?: string;
    category?: string;
    priceChangePct?: ('1h' | '24h' | '7d' | '30d' | '1y')[];
    ids?: string[];
    sparkline?: boolean;  // 7d sparkline 7 日分の価格配列 (CryptoRank UI 風)
  } = {},
): Promise<CgMarketCoin[]> {
  const { page = 1, perPage = 250, vsCurrency = 'usd', category, priceChangePct = ['1h', '24h', '7d', '30d'], ids, sparkline = false } = options;
  const params = new URLSearchParams({
    vs_currency: vsCurrency,
    order: 'market_cap_desc',
    per_page: String(perPage),
    page: String(page),
    sparkline: String(sparkline),
    price_change_percentage: priceChangePct.join(','),
    locale: 'en',
  });
  if (category) params.set('category', category);
  if (ids?.length) params.set('ids', ids.join(','));
  return cgFetch<CgMarketCoin[]>(`/coins/markets?${params}`);
}

/**
 * 個別 coin の詳細 (description, links, categories, tickers 等)
 */
export async function getCoinDetail(id: string): Promise<CgCoinDetail> {
  const params = new URLSearchParams({
    localization: 'true',
    tickers: 'true',
    market_data: 'true',
    community_data: 'true',
    developer_data: 'true',
    sparkline: 'false',
  });
  return cgFetch<CgCoinDetail>(`/coins/${id}?${params}`);
}

/**
 * グローバル統計 (total market cap, BTC dominance 等) — Home page hero に使用
 */
export async function getGlobal(): Promise<CgGlobalData> {
  return cgFetch<CgGlobalData>('/global');
}

/**
 * Trending top 7 coins
 */
export async function getTrending(): Promise<{ coins: Array<{ item: { id: string; name: string; symbol: string; thumb: string; market_cap_rank: number } }> }> {
  return cgFetch('/search/trending');
}

/**
 * Categories 一覧
 */
export async function getCategories(): Promise<Array<{ id: string; name: string; market_cap: number; market_cap_change_24h: number; top_3_coins: string[] }>> {
  return cgFetch('/coins/categories');
}

/**
 * 全件ページネーション (ingestion 用)
 *   yields each page lazily — caller can break early
 */
export async function* iterateAllMarkets(perPage = 250): AsyncGenerator<CgMarketCoin[], void, void> {
  let page = 1;
  while (true) {
    const data = await getMarkets({ page, perPage });
    if (data.length === 0) return;
    yield data;
    if (data.length < perPage) return;
    page++;
    // レート制限保護 (30 call/分 → 2 秒間隔で安全)
    await new Promise((r) => setTimeout(r, 2_000));
  }
}
