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

export interface HlUserFill {
  coin: string;
  px: string;
  sz: string;
  side: 'A' | 'B'; // ask/bid
  time: number;
  startPosition: string;
  dir: string; // 'Open Long' / 'Close Long' / etc
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  builderFee?: string;
  tid: number;
}

/** Returns up to 2000 most recent fills for the user. */
export async function getUserFills(user: string): Promise<HlUserFill[]> {
  return hlFetch({ type: 'userFills', user });
}

export interface HlUserState {
  marginSummary: { accountValue: string; totalNtlPos: string; totalRawUsd: string };
  crossMarginSummary: { accountValue: string };
  assetPositions: Array<{
    type: 'oneWay';
    position: {
      coin: string;
      szi: string;
      entryPx: string;
      positionValue: string;
      unrealizedPnl: string;
      returnOnEquity: string;
      leverage: { type: string; value: number };
      liquidationPx: string;
      marginUsed: string;
    };
  }>;
  withdrawable: string;
  time: number;
}

export async function getClearinghouseState(user: string): Promise<HlUserState> {
  return hlFetch({ type: 'clearinghouseState', user });
}

export interface HlLeaderboardRow {
  ethAddress: string;
  accountValue: string;
  displayName: string | null;
  windowPerformances: Array<['day' | 'week' | 'month' | 'allTime', { pnl: string; roi: string; vlm: string }]>;
  prize: number;
}

/** Top traders leaderboard (cached 1h). */
export async function getLeaderboard(): Promise<{ leaderboardRows: HlLeaderboardRow[] }> {
  // Public unauthenticated endpoint; long cache.
  const res = await fetch('https://stats-data.hyperliquid.xyz/Mainnet/leaderboard', {
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Hyperliquid leaderboard ${res.status}`);
  return (await res.json()) as { leaderboardRows: HlLeaderboardRow[] };
}
