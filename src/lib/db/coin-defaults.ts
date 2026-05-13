/**
 * Coin 型 (60+ フィールド・全データソース統合) のうち、CoinGecko 基本データ
 * (~30 フィールド) で埋まらない拡張シグナルの null defaults.
 *
 * pSEO ページ・CoinGecko fallback で Coin 型を再構築するときに spread して使う:
 *
 *   return { ...COIN_NULL_DEFAULTS, id, symbol, ...coinGeckoFields };
 */

import type { Coin } from '@/types/database';

/**
 * Coin の「拡張シグナル」フィールドのみ. CoinGecko mapper では設定されないが
 * 型シグネチャ上は必須なため null/false/0/{} で埋めて Coin 完全体にする.
 */
export const COIN_NULL_DEFAULTS: Omit<
  Coin,
  // CoinGecko mapper が必ず埋める基本フィールド
  | 'id' | 'cmc_id' | 'cryptorank_id' | 'symbol' | 'name' | 'chain_id' | 'contract_address'
  | 'image_url' | 'website' | 'whitepaper_url' | 'github_url' | 'twitter_url' | 'telegram_url' | 'discord_url'
  | 'rank' | 'price_usd' | 'market_cap_usd' | 'fdv_usd' | 'volume_24h_usd'
  | 'circulating_supply' | 'total_supply' | 'max_supply'
  | 'ath_usd' | 'ath_date' | 'atl_usd' | 'atl_date'
  | 'change_1h' | 'change_24h' | 'change_7d' | 'change_30d' | 'change_1y'
  | 'tier' | 'tier_score' | 'tier_updated_at'
  | 'is_active' | 'source' | 'primary_source_id' | 'created_at' | 'updated_at'
> = {
  // 拡張ソース ID
  defillama_slug: null,
  tokenterminal_slug: null,
  rootdata_project_id: null,
  lunarcrush_id: null,
  // DeFiLlama
  defillama_tvl_usd: null,
  defillama_tvl_change_1d: null,
  defillama_tvl_change_7d: null,
  defillama_category: null,
  defillama_chains: null,
  // Token Terminal (Fundamentals)
  tt_revenue_30d_usd: null,
  tt_revenue_annualized_usd: null,
  tt_fees_30d_usd: null,
  tt_pe_ratio: null,
  tt_ps_ratio: null,
  tt_pf_ratio: null,
  tt_active_users_30d: null,
  // LunarCRUSH (Social)
  lc_galaxy_score: null,
  lc_alt_rank: null,
  lc_social_volume_24h: null,
  lc_social_contributors: null,
  lc_sentiment: null,
  lc_posts_active: null,
  lc_interactions_24h: null,
  // Hyperliquid (Perps)
  hl_listed: false,
  hl_funding_rate: null,
  hl_open_interest_usd: null,
  hl_volume_24h_usd: null,
  hl_mark_price: null,
  hl_max_leverage: null,
  // DEXScreener (DEX liquidity)
  dex_total_liquidity_usd: null,
  dex_pair_count: null,
  dex_top_pair_address: null,
  dex_top_pair_chain: null,
  dex_top_pair_volume_24h: null,
  // Aggregate quality
  audit_count: null,
  funding_total_usd: null,
  funding_latest_round: null,
  funding_latest_date: null,
  funding_latest_valuation_usd: null,
  funding_round_count: 0,
  github_stars: null,
  github_forks: null,
  github_subscribers: null,
  twitter_followers: null,
  reddit_subscribers: null,
  telegram_users: null,
  hack_count: 0,
  hack_total_lost_usd: null,
  exchange_listing_count: 0,
  has_fsa_warning_exchange: false,
  // 最終 ingest 時刻
  last_ingest_coingecko: null,
  last_ingest_defillama: null,
  last_ingest_cryptorank: null,
  last_ingest_tokenomist: null,
  last_ingest_tokenterminal: null,
  last_ingest_lunarcrush: null,
  last_ingest_dexscreener: null,
  last_ingest_hyperliquid: null,
  last_ingest_rootdata: null,
  // Generic metadata
  signals_metadata: {},
};
