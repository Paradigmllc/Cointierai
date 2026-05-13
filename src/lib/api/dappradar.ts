/**
 * DappRadar — dApp users / volume tracker (RapidAPI proxy).
 * Free tier: 30 req/min via RapidAPI.
 *
 * Returns stubbed empty array when DAPPRADAR_API_KEY is not set so the UI
 * still renders an empty-state instead of crashing.
 */

const BASE = 'https://dappradar.com/api/v1';
const API_KEY = process.env.DAPPRADAR_API_KEY;

export interface DrDapp {
  dappId: number;
  name: string;
  slug: string;
  logo: string;
  link: string;
  description: string;
  categories: string[];
  chains: string[];
  metrics?: {
    users: number;
    volume: number;
    transactions: number;
    balance: number;
  };
}

export interface DrAirdrop {
  id: string;
  name: string;
  symbol: string;
  startDate: string;
  endDate: string | null;
  status: 'upcoming' | 'active' | 'ended' | 'unknown';
  description?: string;
  chain?: string;
  url: string;
  logo?: string;
}

async function drFetch<T>(path: string): Promise<T | null> {
  if (!API_KEY) return null;
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-API-Key': API_KEY, Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 1800 },
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as T;
}

export async function getTopDapps(chain?: string, limit = 50): Promise<DrDapp[]> {
  const qs = new URLSearchParams({ range: '24h', sort: '-users', resultsPerPage: String(limit) });
  if (chain) qs.set('chain', chain);
  const data = await drFetch<{ results: DrDapp[] }>(`/dapps?${qs}`);
  return data?.results ?? [];
}

/**
 * Airdrops are scraped from DefiLlama airdrops fork + manual curation as
 * DappRadar doesn't expose a stable free airdrop endpoint. Stubbed for now.
 */
export async function getAirdrops(_status: 'upcoming' | 'active' = 'upcoming'): Promise<DrAirdrop[]> {
  // Placeholder — populated by curated Supabase table or community submission later.
  return [];
}
