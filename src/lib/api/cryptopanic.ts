/**
 * CryptoPanic — news aggregator for crypto.
 * Free tier: 100 req/h. Public posts endpoint requires `auth_token` query param.
 * Docs: https://cryptopanic.com/developers/api/
 */

const BASE = 'https://cryptopanic.com/api/v1';
const TOKEN = process.env.CRYPTOPANIC_API_KEY ?? '';

export interface CpPost {
  id: number;
  kind: string;
  title: string;
  published_at: string;
  url: string;
  source: { title: string; domain: string };
  currencies?: Array<{ code: string; title: string; slug: string }>;
  votes?: { negative: number; positive: number; important: number; liked: number; disliked: number; lol: number; toxic: number; saved: number; comments: number };
}

interface CpListResp {
  count: number;
  results: CpPost[];
  next: string | null;
}

async function cpFetch<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams({ auth_token: TOKEN, public: 'true' });
  for (const [k, v] of Object.entries(query)) if (v != null) qs.set(k, String(v));
  const url = `${BASE}${path}?${qs.toString()}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`CryptoPanic ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

/** Global news feed (latest 20). */
export async function getNews(opts: { currencies?: string; filter?: 'rising' | 'hot' | 'bullish' | 'bearish' | 'important' | 'saved' | 'lol'; kind?: 'news' | 'media'; regions?: string } = {}): Promise<CpPost[]> {
  if (!TOKEN) return [];
  const { results } = await cpFetch<CpListResp>('/posts/', opts).catch(() => ({ results: [] as CpPost[] } as CpListResp));
  return results;
}

/** Per-coin news. CryptoPanic uses symbol codes (BTC, ETH, …). */
export async function getCoinNews(symbol: string, limit = 20): Promise<CpPost[]> {
  const posts = await getNews({ currencies: symbol.toUpperCase(), filter: 'hot' });
  return posts.slice(0, limit);
}
