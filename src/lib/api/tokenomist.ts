/**
 * Tokenomist.ai API client (トークンアンロック詳細)
 *
 * 10 年以上のアンロックスケジュール / ベスティング / 1500+ tokens
 * 価格非公開・要交渉。
 * 独自性: アンロック後の価格影響履歴データ (他 API にない)
 */

const BASE = 'https://api.tokenomist.ai/v1';
const API_KEY = process.env.TOKENOMIST_API_KEY;

async function tmFetch<T>(path: string): Promise<T> {
  if (!API_KEY) {
    // 未契約段階では空データを返す (機能はオプション扱い)
    console.warn('[tokenomist] TOKENOMIST_API_KEY is not set, returning empty data');
    return [] as unknown as T;
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30_000),
    next: { revalidate: 86_400 },
  });
  if (!res.ok) {
    throw new Error(`Tokenomist ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export interface TmUnlock {
  token_symbol: string;
  token_name: string;
  unlock_date: string;
  amount: number;
  percentage_of_supply: number;
  category: string;
  historical_impact_pct: number | null;
}

export async function getUpcomingUnlocks(days = 30): Promise<TmUnlock[]> {
  return tmFetch(`/unlocks/upcoming?days=${days}`);
}

export async function getTokenUnlocks(symbol: string): Promise<TmUnlock[]> {
  return tmFetch(`/tokens/${symbol}/unlocks`);
}
