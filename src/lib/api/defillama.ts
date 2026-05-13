/**
 * DeFiLlama API client
 *
 * 完全無料・商用利用可・帰属表示推奨。
 * Notion 設計書での重要発見:
 *   - 業界インフラ (CoinGecko 自体もここからデータ取得)
 *   - Raises = Crunchbase 代替 (Crunchbase は無料 API 廃止)
 *   - Unlocks / Hacks DB が独自性高い
 */

const BASE = 'https://api.llama.fi';
const COINS_BASE = 'https://coins.llama.fi';
const PRICES_BASE = 'https://pro-api.llama.fi'; // Pro tier (現状は無料 BASE で十分)

async function dlFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Cointier/0.1' },
    signal: AbortSignal.timeout(30_000),
    next: { revalidate: 300 }, // 5 min cache
  });
  if (!res.ok) {
    throw new Error(`DeFiLlama ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

// ============ Types ============
export interface LlamaProtocol {
  id: string;
  name: string;
  symbol: string | null;
  url: string | null;
  description: string | null;
  chain: string;
  chains: string[];
  category: string | null;
  tvl: number | null;
  change_1d: number | null;
  change_7d: number | null;
  mcap: number | null;
  logo: string | null;
  audit_links?: string[];
  language?: string;
  twitter?: string;
}

export interface LlamaRaise {
  date: number; // unix
  name: string;
  round: string | null;
  amount: number | null;
  chains: string[];
  sector: string | null;
  category: string | null;
  source: string | null;
  leadInvestors: string[];
  otherInvestors: string[];
  valuation: number | null;
  defillamaId: string | null;
}

export interface LlamaUnlock {
  symbol: string;
  name: string;
  gecko_id: string | null;
  date: number;
  totalLocked: number;
  nextEvent: {
    date: number;
    toUnlock: number;
    description: string | null;
  } | null;
  events: Array<{
    description: string;
    noOfTokens: number[];
    timestamp: number;
    category: string;
  }>;
  tokenPrice?: number;
  mcap?: number;
}

export interface LlamaHack {
  date: number;
  name: string;
  classification: string | null;
  technique: string | null;
  amount: number | null;
  chain: string[];
  source: string | null;
  bridgeHack?: boolean;
  targetType?: string;
}

// ============ Endpoints ============

/**
 * 全プロトコル一覧 (TVL ランキング含む)
 */
export async function getProtocols(): Promise<LlamaProtocol[]> {
  return dlFetch<LlamaProtocol[]>(`${BASE}/protocols`);
}

/**
 * 個別プロトコル詳細
 */
export async function getProtocol(slug: string): Promise<unknown> {
  return dlFetch(`${BASE}/protocol/${slug}`);
}

/**
 * VC 資金調達 (Raises) — Crunchbase 代替
 */
export async function getRaises(): Promise<{ raises: LlamaRaise[] }> {
  return dlFetch<{ raises: LlamaRaise[] }>(`${BASE}/raises`);
}

/**
 * トークンアンロック予定一覧 (Emissions)
 */
export async function getUnlocks(): Promise<unknown> {
  return dlFetch(`${BASE}/emissions`);
}

/**
 * ハック / エクスプロイト DB
 */
export async function getHacks(): Promise<LlamaHack[]> {
  return dlFetch<LlamaHack[]>(`${BASE}/hacks`);
}

/**
 * ステーブルコイン供給
 */
export async function getStablecoins(): Promise<unknown> {
  return dlFetch(`${BASE}/stablecoins?includePrices=true`);
}

/**
 * チェーン別 TVL
 */
export async function getChains(): Promise<Array<{ name: string; tvl: number; tokenSymbol: string; chainId: number | null }>> {
  return dlFetch(`${BASE}/v2/chains`);
}

/**
 * Yield Pools (APY 上位)
 */
export async function getYieldPools(): Promise<{ data: Array<Record<string, unknown>> }> {
  return dlFetch('https://yields.llama.fi/pools');
}

/**
 * 価格データ (Cross-chain ペア)
 *   coins: "ethereum:0x.../coingecko:bitcoin" 形式
 */
export async function getPrices(coins: string[]): Promise<{ coins: Record<string, { decimals: number; price: number; symbol: string; timestamp: number; confidence: number }> }> {
  const path = coins.join(',');
  return dlFetch(`${COINS_BASE}/prices/current/${path}`);
}
