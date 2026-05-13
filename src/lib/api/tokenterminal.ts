/**
 * Token Terminal API client
 *
 * 重要発見 (Notion 設計書): 月 50 万 req 無料。
 * クリプト版「PER」「PSR」を提供する稀少なソース。
 *   - P/S 比率 (price/sales)
 *   - P/F 比率 (price/fees)
 *   - プロトコル収益・手数料・利益
 *   - 302 プロジェクト対応
 *
 * Cointier の差別化要素: 機関投資家・アナリスト層に刺さる「ファンダメンタルズ」タブを提供。
 */

const BASE = 'https://api.tokenterminal.com/v2';
const API_KEY = process.env.TOKEN_TERMINAL_API_KEY;

async function ttFetch<T>(path: string): Promise<T> {
  if (!API_KEY) {
    console.warn('[tokenterminal] TOKEN_TERMINAL_API_KEY is not set, skipping');
    return [] as unknown as T;
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30_000),
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Token Terminal ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export interface TtProject {
  project_id: string;
  name: string;
  slug: string;
  symbol: string | null;
  category_tags: string[];
  // メトリクス (latest 30d snapshot)
  market_cap: number | null;
  fdv: number | null;
  revenue_30d: number | null;
  revenue_annualized: number | null;
  fees_30d: number | null;
  fees_annualized: number | null;
  ps_ratio: number | null;    // Price / Sales
  pf_ratio: number | null;    // Price / Fees
  active_users_30d: number | null;
}

export async function getProjects(): Promise<{ data: TtProject[] }> {
  return ttFetch('/projects');
}

export async function getProject(slug: string): Promise<{ data: TtProject }> {
  return ttFetch(`/projects/${slug}`);
}

export async function getProjectMetrics(slug: string, metric: string, interval: 'day' | 'week' | 'month' = 'day'): Promise<unknown> {
  return ttFetch(`/projects/${slug}/metrics/${metric}?interval=${interval}`);
}
