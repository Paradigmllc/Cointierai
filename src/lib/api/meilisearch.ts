/**
 * Meilisearch client — typo-tolerant fuzzy search over coins/exchanges/categories.
 *
 * Falls back to `null` when the server is unreachable so callers can transparently
 * fall back to the CoinGecko `/search` endpoint. This lets us self-host Meilisearch
 * on Coolify whenever, without changing call sites.
 *
 * Index schema (created by scripts/meili-index.ts):
 *   coins:      { id, symbol, name, market_cap_rank, image, tier, market_cap_usd }
 *   exchanges:  { id, name, market_type, country, trust_score, image }
 *   categories: { id, name, market_cap }
 */
import { MeiliSearch, type SearchResponse } from 'meilisearch';

const HOST = process.env.MEILISEARCH_HOST ?? '';
const KEY = process.env.MEILISEARCH_SEARCH_KEY ?? process.env.MEILISEARCH_API_KEY ?? '';

let _client: MeiliSearch | null = null;
function client(): MeiliSearch | null {
  if (!HOST) return null;
  if (!_client) {
    try {
      _client = new MeiliSearch({ host: HOST, apiKey: KEY || undefined });
    } catch {
      _client = null;
    }
  }
  return _client;
}

export interface MsCoinHit {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank: number | null;
  image: string;
  tier?: string | null;
  market_cap_usd?: number | null;
}

export interface MsExchangeHit {
  id: string;
  name: string;
  market_type: string;
  country?: string | null;
  trust_score?: number | null;
  image: string;
}

export interface MsCategoryHit {
  id: string;
  name: string;
  market_cap?: number | null;
}

export interface MsGlobalResult {
  coins: MsCoinHit[];
  exchanges: MsExchangeHit[];
  categories: MsCategoryHit[];
  ms: number;
  available: boolean;
}

export async function meiliMultiSearch(query: string, limit = 12): Promise<MsGlobalResult | null> {
  const c = client();
  if (!c) return null;
  try {
    const t0 = Date.now();
    const res = await c.multiSearch({
      queries: [
        { indexUid: 'coins', q: query, limit, attributesToHighlight: ['name', 'symbol'] },
        { indexUid: 'exchanges', q: query, limit: 6 },
        { indexUid: 'categories', q: query, limit: 8 },
      ],
    });
    type Result = SearchResponse<Record<string, unknown>>;
    const results = res.results as unknown as Result[];
    return {
      coins: (results[0]?.hits as unknown as MsCoinHit[]) ?? [],
      exchanges: (results[1]?.hits as unknown as MsExchangeHit[]) ?? [],
      categories: (results[2]?.hits as unknown as MsCategoryHit[]) ?? [],
      ms: Date.now() - t0,
      available: true,
    };
  } catch (e) {
    console.warn('[meilisearch] multi-search failed, falling back', e instanceof Error ? e.message : e);
    return null;
  }
}

/** Health check — used by /api/search to decide which backend to use. */
export async function meiliHealthy(): Promise<boolean> {
  const c = client();
  if (!c) return false;
  try {
    const h = await c.health();
    return h.status === 'available';
  } catch {
    return false;
  }
}
