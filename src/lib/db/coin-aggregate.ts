/**
 * Coin Aggregate — BTC = 1 行に全ソース統合 された完全レコードの取得
 *
 * 単一クエリで coin + translations + funding_rounds + token_unlocks +
 * hacks + exchanges + tier_evaluations を結合取得 (RSC で使用)
 */

import { createServerSupabase } from './supabase';
import type { Coin, Locale } from '@/types/database';

export interface FullCoin extends Coin {
  // Multilingual
  summary: string | null;
  description: string | null;
  // Related arrays
  recent_funding_rounds: Array<{
    round_type: string | null;
    amount_usd: number | null;
    valuation_usd: number | null;
    date: string | null;
    source: string | null;
    source_url: string | null;
  }>;
  upcoming_unlocks: Array<{
    unlock_date: string;
    amount: number;
    percentage_of_supply: number | null;
    category: string | null;
    source: string | null;
  }>;
  hack_history: Array<{
    date: string;
    amount_lost_usd: number | null;
    root_cause: string | null;
    is_recovered: boolean;
  }>;
  exchange_listings: Array<{
    exchange_id: string;
    trading_pair: string;
    volume_24h_usd: number | null;
    fsa_warning: boolean;
  }>;
  latest_tier_evaluation: {
    total_score: number;
    liquidity_score: number | null;
    team_score: number | null;
    technology_score: number | null;
    community_score: number | null;
    regulatory_score: number | null;
    future_score: number | null;
    reasoning: Record<string, unknown> | null;
    evaluated_at: string;
  } | null;
}

/**
 * Full coin record — 全データソース統合
 *
 * Page rendering / API endpoint 両方から使われる single source of truth
 */
export async function getFullCoin(id: string, locale: Locale = 'ja'): Promise<FullCoin | null> {
  const supabase = await createServerSupabase();

  // 1 リクエストにまとめる (TanStack Query / RSC で並列実行されるので OK)
  const [coinResult, txResult, fundingResult, unlocksResult, hacksResult, exchangesResult, tierResult] = await Promise.all([
    supabase.from('coins').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('coin_translations')
      .select('summary, description')
      .eq('coin_id', id)
      .eq('locale', locale)
      .maybeSingle(),
    supabase
      .from('funding_rounds')
      .select('round_type, amount_usd, valuation_usd, date, source, source_url')
      .eq('coin_id', id)
      .order('date', { ascending: false })
      .limit(20),
    supabase
      .from('token_unlocks')
      .select('unlock_date, amount, percentage_of_supply, category, source')
      .eq('coin_id', id)
      .gte('unlock_date', new Date().toISOString())
      .order('unlock_date', { ascending: true })
      .limit(20),
    supabase
      .from('hacks')
      .select('date, amount_lost_usd, root_cause, is_recovered')
      .eq('coin_id', id)
      .order('date', { ascending: false })
      .limit(10),
    supabase
      .from('coin_exchanges')
      .select('exchange_id, trading_pair, volume_24h_usd, exchanges(fsa_warning)')
      .eq('coin_id', id)
      .order('volume_24h_usd', { ascending: false, nullsFirst: false })
      .limit(20),
    supabase
      .from('tier_evaluations')
      .select(`
        total_score, liquidity_score, team_score, technology_score,
        community_score, regulatory_score, future_score, reasoning, evaluated_at
      `)
      .eq('coin_id', id)
      .order('evaluated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!coinResult.data) return null;

  return {
    ...(coinResult.data as Coin),
    summary: (txResult.data as { summary: string | null } | null)?.summary ?? null,
    description: (txResult.data as { description: string | null } | null)?.description ?? null,
    recent_funding_rounds: fundingResult.data ?? [],
    upcoming_unlocks: unlocksResult.data ?? [],
    hack_history: hacksResult.data ?? [],
    exchange_listings: (exchangesResult.data ?? []).map((e) => ({
      exchange_id: e.exchange_id,
      trading_pair: e.trading_pair,
      volume_24h_usd: e.volume_24h_usd,
      fsa_warning: (e.exchanges as { fsa_warning: boolean } | null)?.fsa_warning ?? false,
    })),
    latest_tier_evaluation: tierResult.data ?? null,
  };
}

/**
 * Source coverage report — どのソースから取得されているか
 *   (運用ダッシュボード用)
 */
export interface SourceCoverage {
  source: string;
  lastIngest: string | null;
  isRecent: boolean;
}

export function getSourceCoverage(coin: Coin): SourceCoverage[] {
  const sources: Array<[string, string | null | undefined]> = [
    ['CoinGecko', coin.last_ingest_coingecko],
    ['DeFiLlama', coin.last_ingest_defillama],
    ['CryptoRank', coin.last_ingest_cryptorank],
    ['Tokenomist', coin.last_ingest_tokenomist],
    ['Token Terminal', coin.last_ingest_tokenterminal],
    ['LunarCRUSH', coin.last_ingest_lunarcrush],
    ['DEXScreener', coin.last_ingest_dexscreener],
    ['Hyperliquid', coin.last_ingest_hyperliquid],
    ['RootData', coin.last_ingest_rootdata],
  ];
  const DAY_AGO = Date.now() - 86_400_000;
  return sources
    .filter(([, t]) => t)
    .map(([source, lastIngest]) => ({
      source,
      lastIngest: lastIngest ?? null,
      isRecent: lastIngest ? new Date(lastIngest).getTime() > DAY_AGO : false,
    }));
}
