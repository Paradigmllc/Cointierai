/**
 * CryptoRank API client (Sandbox / Basic)
 *
 * Sandbox: 月 10,000 cr / 14 endpoints / BY-NC-SA (商用禁止)
 * Basic:   $19/月 / 月 100,000 cr / 19 endpoints / BY-CC-SA (商用可・帰属表示必須)
 *
 * 帰属表示: "Powered by CryptoRank" を Footer に必須。
 */

const BASE = 'https://api.cryptorank.io/v2';
const API_KEY = process.env.CRYPTORANK_API_KEY;

async function crFetch<T>(path: string): Promise<T> {
  if (!API_KEY) {
    throw new Error('CRYPTORANK_API_KEY is not set (see ~/.claude/projects/D--dev-cointierai/memory/reference_api_keys.md)');
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-Api-Key': API_KEY, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30_000),
    next: { revalidate: 3600 }, // 1 hour cache (VC/IDO データは頻繁に変わらない)
  });
  if (!res.ok) {
    throw new Error(`CryptoRank ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export interface CrCurrency {
  id: number;
  key: string; // slug
  symbol: string;
  name: string;
  category: string | null;
  hasTokenSale: boolean;
  rank: number | null;
  values: Record<string, { price: number; marketCap: number | null; volume24h: number | null; percentChange24h: number | null }>;
}

export interface CrFundingRound {
  id: number;
  type: string;
  date: string;
  amount: number | null;
  valuation: number | null;
  investors: Array<{ id: number; name: string; isLead: boolean }>;
  sourceUrl: string | null;
}

export interface CrTokenSale {
  id: number;
  currencyKey: string;
  type: string; // 'ICO' / 'IDO' / 'IEO' / 'private'
  startDate: string | null;
  endDate: string | null;
  totalRaise: number | null;
  tokenPrice: number | null;
  exchanges: string[];
}

export async function getCurrencies(options: { limit?: number; offset?: number } = {}): Promise<{ data: CrCurrency[]; status: { totalItems: number } }> {
  const { limit = 100, offset = 0 } = options;
  return crFetch(`/currencies?limit=${limit}&offset=${offset}`);
}

export async function getCurrency(key: string): Promise<{ data: CrCurrency }> {
  return crFetch(`/currencies/${key}`);
}

export async function getFundingRounds(key: string): Promise<{ data: CrFundingRound[] }> {
  return crFetch(`/currencies/${key}/funding-rounds`);
}

export async function getTokenSales(): Promise<{ data: CrTokenSale[] }> {
  return crFetch('/token-sales');
}

/**
 * 全銘柄を limit 単位でページネーション (37K coins → ~370 calls)
 *   Sandbox では 1 day で全件取得可能 (370 cr ≤ 400/日)
 */
export async function* iterateAllCurrencies(perPage = 100): AsyncGenerator<CrCurrency[], void, void> {
  let offset = 0;
  while (true) {
    const { data } = await getCurrencies({ limit: perPage, offset });
    if (!data.length) return;
    yield data;
    if (data.length < perPage) return;
    offset += perPage;
    await new Promise((r) => setTimeout(r, 700)); // 100 req/分 → 700ms 間隔
  }
}
