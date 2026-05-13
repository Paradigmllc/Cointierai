/**
 * Macro correlation data — DXY (US dollar), Gold, S&P500 via Yahoo Finance public chart endpoint.
 * Stooq fallback when Yahoo throttles.
 */

const Y_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

export interface MacroSeries {
  symbol: string;
  prices: number[];
  timestamps: number[];
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
}

async function yFetch(symbol: string, range = '1mo'): Promise<MacroSeries | null> {
  const url = `${Y_BASE}/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 Cointier/0.1' },
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const json = (await res.json()) as {
    chart?: { result?: Array<{ timestamp: number[]; indicators: { quote: Array<{ close: (number | null)[] }> } }>; error?: unknown };
  };
  const result = json.chart?.result?.[0];
  if (!result) return null;
  const closes = result.indicators.quote[0].close.filter((v): v is number => v != null);
  const ts = result.timestamp.slice(-closes.length);
  const last = closes[closes.length - 1];
  const ago = (days: number): number | null => {
    const idx = closes.length - 1 - days;
    if (idx < 0) return null;
    return ((last - closes[idx]) / closes[idx]) * 100;
  };
  return {
    symbol,
    prices: closes,
    timestamps: ts,
    change24h: ago(1),
    change7d: ago(7),
    change30d: ago(30),
  };
}

/** DXY (US Dollar Index). */
export async function getDxy(): Promise<MacroSeries | null> {
  return yFetch('DX-Y.NYB');
}

/** Gold spot price (per ounce). */
export async function getGold(): Promise<MacroSeries | null> {
  return yFetch('GC=F');
}

/** S&P 500. */
export async function getSpx(): Promise<MacroSeries | null> {
  return yFetch('^GSPC');
}

/** US 10Y Treasury yield. */
export async function getUs10y(): Promise<MacroSeries | null> {
  return yFetch('^TNX');
}

/** Pearson correlation between two equal-length series. */
export function correlation(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 5) return null;
  const ax = a.slice(-n);
  const bx = b.slice(-n);
  const meanA = ax.reduce((s, v) => s + v, 0) / n;
  const meanB = bx.reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i += 1) {
    const da = ax[i] - meanA;
    const db = bx[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  if (denA === 0 || denB === 0) return null;
  return num / Math.sqrt(denA * denB);
}
