/**
 * Hyperliquid API client (Perps + Spot DEX)
 *
 * 完全無料・公開・100 req/分。
 * Notion 設計書での核心: Builder Fee 0.035-0.05% 永続オンチェーン収益。
 * M4+ で Privy + WalletConnect 経由で承認フロー実装。
 */

const INFO_BASE = 'https://api.hyperliquid.xyz/info';

async function hlFetch<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(INFO_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Hyperliquid ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export interface HlMeta {
  universe: Array<{ name: string; szDecimals: number; maxLeverage: number; onlyIsolated: boolean }>;
}

export interface HlMarketContext {
  funding: string; // hourly rate
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium: string | null;
  oraclePx: string;
  markPx: string;
  midPx: string;
  impactPxs: [string, string];
}

export async function getMeta(): Promise<HlMeta> {
  return hlFetch({ type: 'meta' });
}

/**
 * Perps universe + market context (price/funding/oi)
 */
export async function getMetaAndCtxs(): Promise<[HlMeta, HlMarketContext[]]> {
  return hlFetch({ type: 'metaAndAssetCtxs' });
}

/**
 * 個別 coin の funding history
 */
export async function getFundingHistory(coin: string, startTime: number): Promise<Array<{ time: number; fundingRate: string; premium: string }>> {
  return hlFetch({ type: 'fundingHistory', coin, startTime });
}
