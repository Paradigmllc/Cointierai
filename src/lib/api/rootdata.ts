/**
 * RootData API client (アジア VC 特化)
 *
 * 重要度: ⭐⭐⭐⭐⭐ Cointier 差別化コア
 * Animoca Brands / HashKey / Foresight Ventures などアジアトップ 10 VC の詳細データ。
 * クレジット制 (一部無料)。
 *
 * API ドキュメント: https://www.rootdata.com/openapi
 */

const BASE = 'https://api.rootdata.com/open';
const API_KEY = process.env.ROOTDATA_API_KEY;

async function rdFetch<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  if (!API_KEY) {
    throw new Error('ROOTDATA_API_KEY is not set');
  }
  const res = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'apikey': API_KEY, 'language': 'en', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
    next: { revalidate: 86_400 }, // 24h cache
  });
  if (!res.ok) {
    throw new Error(`RootData ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export interface RdProject {
  project_id: number;
  project_name: string;
  logo: string;
  token_symbol: string | null;
  one_liner: string | null;
  description: string | null;
  active: boolean;
  total_funding: number | null;
  rootdataurl: string;
  tags: string[];
}

export interface RdInvestor {
  invest_id: number;
  invest_name: string;
  logo: string;
  description: string | null;
  area: string[]; // region: 'Asia' / 'US' / etc
  invest_num: number;
}

export interface RdFundingRound {
  amount: number | null;
  round: string;
  published_time: string;
  lead_investors: string[];
  invest_valuation: number | null;
}

export async function searchProjects(query: string): Promise<{ data: RdProject[] }> {
  return rdFetch('/ser_inv', { query });
}

export async function getProjectDetail(projectId: number): Promise<{ data: RdProject & { fundraising_rounds: RdFundingRound[] } }> {
  return rdFetch('/get_item', { project_id: projectId, include_team: true, include_investors: true });
}

export async function getInvestors(query: string): Promise<{ data: RdInvestor[] }> {
  return rdFetch('/ser_inv', { query });
}

export async function getInvestorBatch(): Promise<{ data: RdInvestor[] }> {
  // 全 VC 投資家一覧 (Asia フィルター後)
  return rdFetch('/get_invest_batch', { page: 1 });
}
