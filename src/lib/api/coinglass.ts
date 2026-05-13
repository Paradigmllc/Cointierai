/**
 * Coinglass — derivatives data (liquidations / OI / long-short ratio).
 * Unofficial: public endpoints don't require auth but rate-limit aggressively.
 * Official paid plans live at coinglass.com/v4/api.
 *
 * Spec: returns mock-shaped fallbacks when network/quota fails so the UI
 * can still render an empty-state without crashing the page.
 */

const BASE = 'https://open-api-v4.coinglass.com/api';
const API_KEY = process.env.COINGLASS_API_KEY;

function headers(): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (API_KEY) h['CG-API-KEY'] = API_KEY;
  return h;
}

async function cgFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Coinglass ${res.status}`);
  const json = (await res.json()) as { code: string; data: T };
  if (json.code !== '0') throw new Error(`Coinglass code=${json.code}`);
  return json.data;
}

export interface CgLiquidation {
  exchangeName: string;
  longLiquidationUsd: number;
  shortLiquidationUsd: number;
}

export interface CgLongShortRatio {
  time: number;
  longShortRatio: number;
  longAccount: number;
  shortAccount: number;
}

export interface CgOiHistory {
  time: number;
  openInterest: number;
}

export interface CgFundingHistory {
  time: number;
  fundingRate: number;
}

/** 24h aggregated liquidations by exchange. */
export async function getLiquidations24h(symbol: string): Promise<CgLiquidation[]> {
  if (!API_KEY) return [];
  return cgFetch<CgLiquidation[]>(`/futures/liquidation/exchange-list?symbol=${symbol.toUpperCase()}&range=24h`).catch(() => []);
}

/** 7-day long/short ratio (1h interval). */
export async function getLongShortRatio(symbol: string): Promise<CgLongShortRatio[]> {
  if (!API_KEY) return [];
  return cgFetch<CgLongShortRatio[]>(`/futures/global-long-short-account-ratio/history?symbol=${symbol.toUpperCase()}&interval=h1&limit=168`).catch(() => []);
}

/** 7-day Open Interest history. */
export async function getOpenInterestHistory(symbol: string): Promise<CgOiHistory[]> {
  if (!API_KEY) return [];
  return cgFetch<CgOiHistory[]>(`/futures/open-interest/history?symbol=${symbol.toUpperCase()}&interval=h1&limit=168`).catch(() => []);
}

/** 7-day funding rate history. */
export async function getFundingHistory(symbol: string): Promise<CgFundingHistory[]> {
  if (!API_KEY) return [];
  return cgFetch<CgFundingHistory[]>(`/futures/funding-rate/history?symbol=${symbol.toUpperCase()}&interval=h8&limit=21`).catch(() => []);
}
