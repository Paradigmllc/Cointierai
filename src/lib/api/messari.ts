/**
 * Messari Asset API — free endpoints.
 * Docs: https://messari.io/api/docs
 * Attribution required: "Powered by Messari".
 */

const BASE = 'https://data.messari.io/api/v1';
const API_KEY = process.env.MESSARI_API_KEY; // optional — raises rate limits

function headers(): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (API_KEY) h['x-messari-api-key'] = API_KEY;
  return h;
}

async function msFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Messari ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export interface MsAssetProfile {
  id: string;
  symbol: string;
  name: string;
  slug: string;
  profile?: {
    general?: {
      overview?: {
        project_details?: string;
        tagline?: string;
        category?: string;
        sector?: string;
        official_links?: Array<{ name: string; link: string }>;
      };
    };
    contributors?: {
      individuals?: Array<{ name: string; title: string }>;
      organizations?: Array<{ name: string }>;
    };
    investors?: {
      individuals?: Array<{ name: string; position?: string }>;
      organizations?: Array<{ name: string }>;
    };
    governance?: {
      governance_details?: string;
    };
    technology?: {
      overview?: {
        technology_details?: string;
      };
    };
  };
  metrics?: {
    market_data?: { price_usd: number };
    roi_data?: { percent_change_last_1_week: number; percent_change_last_1_month: number; percent_change_last_3_months: number; percent_change_last_1_year: number; percent_change_btc_last_1_week: number; percent_change_eth_last_1_week: number };
    supply?: { circulating: number; y_2050: number; y_plus10: number; liquid: number };
    cycle_low?: { price: number; price_usd: number; at: string; percent_up: number };
    cycle_high?: { price: number; price_usd: number; at: string; percent_down: number };
    all_time_high?: { price: number; at: string; days_since: number; percent_down: number };
    blockchain_stats_24_hours?: { count_of_active_addresses: number; transaction_volume: number; adjusted_transaction_volume: number; adjusted_nvt: number };
    misc_data?: { vladimir_club_cost: number; btc_current_normalized_supply_price_usd: number };
  };
}

export async function getAssetProfile(slug: string): Promise<MsAssetProfile | null> {
  try {
    const { data } = await msFetch<{ data: MsAssetProfile }>(`/assets/${slug}/profile?fields=symbol,name,slug,profile`);
    return data;
  } catch {
    return null;
  }
}

export async function getAssetMetrics(slug: string): Promise<MsAssetProfile['metrics'] | null> {
  try {
    const { data } = await msFetch<{ data: { metrics: MsAssetProfile['metrics'] } }>(`/assets/${slug}/metrics`);
    return data.metrics;
  } catch {
    return null;
  }
}
