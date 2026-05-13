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
/**
 * Detailed protocol payload from DeFiLlama. Includes per-day TVL history,
 * per-chain breakdown, MCap timeline, treasury, audits, hallmarks. This is
 * the heaviest endpoint — gzipped responses can hit 500KB+ for top protocols,
 * so it's cached for 5 minutes via the dlFetch revalidate.
 */
export interface LlamaProtocolDetail {
  id: string;
  name: string;
  symbol: string | null;
  url: string | null;
  description: string | null;
  category: string | null;
  chains: string[];
  twitter: string | null;
  audits: string | null;
  audit_links?: string[];
  logo?: string | null;
  mcap?: number | null;
  fdv?: number | null;
  /** Per-day total TVL across all chains. */
  tvl: Array<{ date: number; totalLiquidityUSD: number }>;
  /** Per-chain TVL history. Keys are chain names; some are derived like "Ethereum-borrowed". */
  chainTvls: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
  /** Significant events (audit completed, hack, upgrade, etc.) — [timestamp, label]. */
  hallmarks?: Array<[number, string]>;
}

export async function getProtocolDetail(slug: string): Promise<LlamaProtocolDetail> {
  return dlFetch<LlamaProtocolDetail>(`${BASE}/protocol/${slug}`);
}

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

// ============ Extended endpoints (Phase 1-2) ============

export interface LlamaBridge {
  id: number;
  name: string;
  displayName: string;
  icon: string | null;
  url: string | null;
  chains: string[];
  destinationChain?: string;
  volumePrevDay: number;
  volumePrev2Day: number;
  txsPrevDay: number;
}

export async function getBridges(): Promise<{ bridges: LlamaBridge[]; chains: Array<{ name: string; totalTxs: number; volumePrevDay: number }> }> {
  return dlFetch('https://bridges.llama.fi/bridges?includeChains=true');
}

export interface LlamaDerivative {
  name: string;
  logo: string | null;
  category: string | null;
  chains: string[];
  total24h: number;
  total48hto24h: number | null;
  total7d: number | null;
  totalAllTime: number | null;
  change_1d: number | null;
  change_7d: number | null;
  protocolType: string;
  slug: string;
}

export async function getDerivatives(): Promise<{ protocols: LlamaDerivative[]; total24h: number; change_1d: number }> {
  return dlFetch(`${BASE}/overview/derivatives?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`);
}

export interface LlamaFee {
  name: string;
  logo: string | null;
  category: string | null;
  chains: string[];
  total24h: number;
  total7d: number | null;
  total30d: number | null;
  totalAllTime: number | null;
  change_1d: number | null;
  change_7d: number | null;
  revenue24h: number | null;
  revenue7d: number | null;
  slug: string;
}

export async function getFees(): Promise<{ protocols: LlamaFee[]; total24h: number }> {
  return dlFetch(`${BASE}/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`);
}

export async function getDexOverview(): Promise<{ protocols: LlamaFee[]; total24h: number }> {
  return dlFetch(`${BASE}/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`);
}

/** Historical chain TVL: [{ date, tvl }, …]. */
export async function getChainTvlHistory(chain: string): Promise<Array<{ date: number; tvl: number }>> {
  return dlFetch(`${BASE}/v2/historicalChainTvl/${chain}`);
}

export interface LlamaStablecoinAsset {
  id: number;
  name: string;
  symbol: string;
  gecko_id: string | null;
  pegType: string;
  pegMechanism: string;
  circulating: { peggedUSD: number };
  circulatingPrevDay: { peggedUSD: number };
  circulatingPrevWeek: { peggedUSD: number };
  circulatingPrevMonth: { peggedUSD: number };
  chainCirculating: Record<string, { current: { peggedUSD: number } }>;
  price?: number;
}

export async function getStablecoinList(): Promise<{ peggedAssets: LlamaStablecoinAsset[] }> {
  return dlFetch('https://stablecoins.llama.fi/stablecoins?includePrices=true');
}
