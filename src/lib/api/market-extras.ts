/**
 * Market extras — Fear & Greed / Altcoin Season Index / ETH Gas / Total Unlocks
 *
 * 各データソースは free public API. 全て server-side で取得し ISR cache.
 */

interface FearGreed {
  value: number;
  classification: string; // 'Extreme Fear' / 'Fear' / 'Neutral' / 'Greed' / 'Extreme Greed'
  timestamp: number;
}

/**
 * Fear & Greed Index (alternative.me) — free・key 不要
 */
export async function getFearGreed(): Promise<FearGreed | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 3600 }, // 1h
    });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.data?.[0];
    if (!d) return null;
    return {
      value: parseInt(d.value, 10),
      classification: d.value_classification,
      timestamp: parseInt(d.timestamp, 10),
    };
  } catch (e) {
    console.warn('[market-extras] fearGreed fetch failed', e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * ETH Gas Price (Beaconcha.in - free, no key)
 */
export async function getEthGasGwei(): Promise<number | null> {
  try {
    const res = await fetch('https://beaconcha.in/api/v1/execution/gasnow', {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const fast = json?.data?.fast;
    if (!fast) return null;
    return fast / 1e9; // wei → gwei
  } catch (e) {
    console.warn('[market-extras] ethGas fetch failed', e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Altcoin Season Index — 自前計算
 * "Top 50 (excl BTC) coins outperforming BTC over 30d" の割合
 * - 75+ = Altcoin Season
 * - 25- = Bitcoin Season
 *
 * coins: 上位 50 coin の change_30d を持つ Coin 配列
 */
export function calcAltcoinSeasonIndex(
  coins: Array<{ id: string; change_30d?: number | null }>,
  btcChange30d: number | null,
): number | null {
  if (btcChange30d == null) return null;
  // Top 50 (exclude BTC, exclude stablecoins approximated by tiny change)
  const top50 = coins
    .filter((c) => c.id !== 'bitcoin' && c.change_30d != null && Math.abs(c.change_30d) > 0.1)
    .slice(0, 50);
  if (top50.length < 10) return null;
  const outperformers = top50.filter((c) => (c.change_30d ?? -Infinity) > btcChange30d).length;
  return Math.round((outperformers / top50.length) * 100);
}

/**
 * Total token unlocks USD (7d) — DeFiLlama
 */
export async function getTotalUnlocks7d(): Promise<number | null> {
  try {
    const res = await fetch('https://api.llama.fi/emissions', {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    // emissions endpoint structure may vary — defensive sum over next 7 days
    if (!Array.isArray(json)) return null;
    const now = Date.now() / 1000;
    const in7d = now + 7 * 86_400;
    let total = 0;
    for (const protocol of json) {
      const events = protocol?.events ?? [];
      for (const ev of events) {
        const ts = Number(ev?.timestamp);
        const usdValue = Number(ev?.usd_value ?? ev?.value);
        if (ts > now && ts < in7d && Number.isFinite(usdValue)) {
          total += usdValue;
        }
      }
    }
    return total > 0 ? total : null;
  } catch (e) {
    console.warn('[market-extras] unlocks fetch failed', e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * BTC dominance 7d sparkline (CoinGecko global chart endpoint)
 * Returns 168 hourly values
 */
export async function getBtcDominanceSparkline(): Promise<number[] | null> {
  try {
    // CoinGecko /global/market_cap_chart は cap data のみ・dominance は計算
    // 簡易版: ja/en 共通の history は別途 supabase に蓄積想定. M0 は null 返却で許容
    return null;
  } catch (e) {
    console.warn('[market-extras] btcDomSparkline fetch failed', e instanceof Error ? e.message : e);
    return null;
  }
}
