/**
 * DB クエリ helper — pages / API routes から DB 経由でデータ取得
 *
 * 設計方針:
 *   - DB-first (Supabase に ingestion 済データ)
 *   - CoinGecko fallback (DB 空のときの開発初期サポート)
 *   - server-side のみで呼び出し (RSC / API routes)
 */

import { createServerSupabase } from './supabase';
import { getMarkets, getCoinDetail, getGlobal } from '@/lib/api/coingecko';
import type { Coin, Tier, Locale } from '@/types/database';

function tierFromRank(rank: number | null): Tier | null {
  if (rank === null) return null;
  if (rank <= 20) return 'S';
  if (rank <= 100) return 'A';
  if (rank <= 500) return 'B';
  if (rank <= 2000) return 'C';
  if (rank <= 5000) return 'D';
  return 'F';
}

/**
 * Top N coins (DB-first, CoinGecko fallback)
 *
 * @param options.limit  最大件数 (default 250)
 * @param options.offset ページング (default 0)
 * @param options.tier   tier フィルタ (S/A/B/C/D/F)
 */
export async function getTopCoins(options: {
  limit?: number;
  offset?: number;
  tier?: Tier;
} = {}): Promise<Coin[]> {
  const { limit = 250, offset = 0, tier } = options;

  try {
    const supabase = await createServerSupabase();
    let query = supabase
      .from('coins')
      .select('*')
      .eq('is_active', true)
      .order('market_cap_usd', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (tier) query = query.eq('tier', tier);

    const { data, error } = await query;
    if (error) {
      console.error('[queries] getTopCoins DB error:', error.message);
      throw error;
    }
    if (data && data.length > 0) {
      return data as Coin[];
    }
  } catch (e) {
    console.warn('[queries] DB query failed, falling back to CoinGecko:', e instanceof Error ? e.message : e);
  }

  // Fallback to CoinGecko live API (DB 未投入時の開発初期サポート)
  const page = Math.floor(offset / limit) + 1;
  try {
    const markets = await getMarkets({ page, perPage: limit });
    return markets.map(mapCoinGeckoMarketToCoin);
  } catch (e) {
    console.error('[queries] CoinGecko fallback also failed:', e);
    return [];
  }
}

/**
 * Single coin detail (DB-first, CoinGecko fallback)
 */
export async function getCoin(id: string): Promise<{ coin: Coin; summary: string | null } | null> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('coins')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('[queries] getCoin DB error:', error.message);
    }
    if (data) {
      // multilingual summary
      const { data: tx } = await supabase
        .from('coin_translations')
        .select('summary')
        .eq('coin_id', id)
        .maybeSingle();
      return { coin: data as Coin, summary: (tx?.summary as string | null) ?? null };
    }
  } catch (e) {
    console.warn('[queries] getCoin DB failed:', e instanceof Error ? e.message : e);
  }

  // CoinGecko fallback
  try {
    const detail = await getCoinDetail(id);
    return { coin: mapCoinGeckoDetailToCoin(detail), summary: null };
  } catch (e) {
    console.error('[queries] CoinGecko detail also failed for', id, e);
    return null;
  }
}

/**
 * Locale-aware summary fetch
 */
export async function getCoinSummary(coinId: string, locale: Locale): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from('coin_translations')
      .select('summary')
      .eq('coin_id', coinId)
      .eq('locale', locale)
      .maybeSingle();
    return (data?.summary as string | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Top movers (24h gainers/losers)
 */
export async function getTopMovers(direction: 'gainers' | 'losers', limit = 5): Promise<Coin[]> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from('coins')
      .select('*')
      .eq('is_active', true)
      .not('change_24h', 'is', null)
      .order('change_24h', { ascending: direction === 'losers', nullsFirst: false })
      .limit(limit);
    if (data && data.length > 0) return data as Coin[];
  } catch (e) {
    console.warn('[queries] getTopMovers DB failed:', e);
  }
  // Fallback
  const all = await getTopCoins({ limit: 250 });
  const filtered = all.filter((c) => c.change_24h !== null);
  filtered.sort((a, b) => (direction === 'losers' ? (a.change_24h ?? 0) - (b.change_24h ?? 0) : (b.change_24h ?? 0) - (a.change_24h ?? 0)));
  return filtered.slice(0, limit);
}

/**
 * Global market stats
 */
export async function getMarketGlobal(): Promise<{
  totalMarketCapUsd: number;
  totalVolume24hUsd: number;
  btcDominance: number;
  ethDominance: number;
  activeCoins: number;
  marketCapChange24h: number;
} | null> {
  try {
    const g = await getGlobal();
    return {
      totalMarketCapUsd: g.data.total_market_cap.usd,
      totalVolume24hUsd: g.data.total_volume.usd,
      btcDominance: g.data.market_cap_percentage.btc ?? 0,
      ethDominance: g.data.market_cap_percentage.eth ?? 0,
      activeCoins: g.data.active_cryptocurrencies,
      marketCapChange24h: g.data.market_cap_change_percentage_24h_usd,
    };
  } catch (e) {
    console.error('[queries] getMarketGlobal failed:', e);
    return null;
  }
}

// ============ Mappers (CoinGecko fallback 用) ============

function mapCoinGeckoMarketToCoin(m: Awaited<ReturnType<typeof getMarkets>>[number]): Coin {
  const rank = m.market_cap_rank ?? null;
  return {
    id: m.id,
    cmc_id: null,
    cryptorank_id: null,
    symbol: m.symbol,
    name: m.name,
    chain_id: null,
    contract_address: null,
    image_url: m.image,
    website: null,
    whitepaper_url: null,
    github_url: null,
    twitter_url: null,
    telegram_url: null,
    discord_url: null,
    rank,
    price_usd: m.current_price,
    market_cap_usd: m.market_cap,
    fdv_usd: m.fully_diluted_valuation,
    volume_24h_usd: m.total_volume,
    circulating_supply: m.circulating_supply,
    total_supply: m.total_supply,
    max_supply: m.max_supply,
    ath_usd: m.ath,
    ath_date: m.ath_date,
    atl_usd: m.atl,
    atl_date: m.atl_date,
    change_1h: m.price_change_percentage_1h_in_currency ?? null,
    change_24h: m.price_change_percentage_24h,
    change_7d: m.price_change_percentage_7d_in_currency ?? null,
    change_30d: m.price_change_percentage_30d_in_currency ?? null,
    change_1y: m.price_change_percentage_1y_in_currency ?? null,
    tier: tierFromRank(rank),
    tier_score: null,
    tier_updated_at: null,
    is_active: true,
    source: 'coingecko',
    primary_source_id: m.id,
    created_at: m.last_updated ?? new Date().toISOString(),
    updated_at: m.last_updated ?? new Date().toISOString(),
  };
}

function mapCoinGeckoDetailToCoin(d: Awaited<ReturnType<typeof getCoinDetail>>): Coin {
  const rank = d.market_cap_rank ?? null;
  return {
    id: d.id,
    cmc_id: null,
    cryptorank_id: null,
    symbol: d.symbol,
    name: d.name,
    chain_id: null,
    contract_address: null,
    image_url: d.image ?? null,
    website: d.links?.homepage?.[0] ?? null,
    whitepaper_url: d.links?.whitepaper ?? null,
    github_url: d.links?.repos_url?.github?.[0] ?? null,
    twitter_url: d.links?.twitter_screen_name ? `https://twitter.com/${d.links.twitter_screen_name}` : null,
    telegram_url: d.links?.telegram_channel_identifier ? `https://t.me/${d.links.telegram_channel_identifier}` : null,
    discord_url: null,
    rank,
    price_usd: d.current_price ?? null,
    market_cap_usd: d.market_cap ?? null,
    fdv_usd: d.fully_diluted_valuation ?? null,
    volume_24h_usd: d.total_volume ?? null,
    circulating_supply: d.circulating_supply ?? null,
    total_supply: d.total_supply ?? null,
    max_supply: d.max_supply ?? null,
    ath_usd: d.ath ?? null,
    ath_date: d.ath_date ?? null,
    atl_usd: d.atl ?? null,
    atl_date: d.atl_date ?? null,
    change_1h: d.price_change_percentage_1h_in_currency ?? null,
    change_24h: d.price_change_percentage_24h ?? null,
    change_7d: d.price_change_percentage_7d_in_currency ?? null,
    change_30d: d.price_change_percentage_30d_in_currency ?? null,
    change_1y: d.price_change_percentage_1y_in_currency ?? null,
    tier: tierFromRank(rank),
    tier_score: null,
    tier_updated_at: null,
    is_active: true,
    source: 'coingecko',
    primary_source_id: d.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
