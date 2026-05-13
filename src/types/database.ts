/**
 * Cointier — Database type definitions
 *
 * Supabase migration 00001_init.sql に対応。
 * 実運用では `npx supabase gen types typescript` で自動生成する想定だが、
 * 初期段階では手動で同期する。
 */

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
export type Locale = 'ja' | 'en' | 'th' | 'vi' | 'id' | 'zh-TW' | 'ko';
export type SubscriptionPlan = 'free' | 'pro' | 'business';
export type BillingCycle = 'monthly' | 'yearly';
export type TradeType = 'buy' | 'sell' | 'transfer_in' | 'transfer_out';

export interface Coin {
  // Basic identity
  id: string;
  cmc_id: number | null;
  cryptorank_id: string | null;
  defillama_slug: string | null;
  tokenterminal_slug: string | null;
  rootdata_project_id: number | null;
  lunarcrush_id: number | null;
  symbol: string;
  name: string;
  chain_id: string | null;
  contract_address: string | null;
  image_url: string | null;
  website: string | null;
  whitepaper_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  telegram_url: string | null;
  discord_url: string | null;

  // Price / market (CoinGecko)
  rank: number | null;
  price_usd: number | null;
  market_cap_usd: number | null;
  fdv_usd: number | null;
  volume_24h_usd: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath_usd: number | null;
  ath_date: string | null;
  atl_usd: number | null;
  atl_date: string | null;
  change_1h: number | null;
  change_24h: number | null;
  change_7d: number | null;
  change_30d: number | null;
  change_1y: number | null;

  // DeFiLlama signals
  defillama_tvl_usd: number | null;
  defillama_tvl_change_1d: number | null;
  defillama_tvl_change_7d: number | null;
  defillama_category: string | null;
  defillama_chains: string[] | null;

  // Token Terminal (Fundamentals)
  tt_revenue_30d_usd: number | null;
  tt_revenue_annualized_usd: number | null;
  tt_fees_30d_usd: number | null;
  tt_pe_ratio: number | null;
  tt_ps_ratio: number | null;
  tt_pf_ratio: number | null;
  tt_active_users_30d: number | null;

  // LunarCRUSH (Social)
  lc_galaxy_score: number | null;
  lc_alt_rank: number | null;
  lc_social_volume_24h: number | null;
  lc_social_contributors: number | null;
  lc_sentiment: number | null;
  lc_posts_active: number | null;
  lc_interactions_24h: number | null;

  // Hyperliquid (Perps)
  hl_listed: boolean;
  hl_funding_rate: number | null;
  hl_open_interest_usd: number | null;
  hl_volume_24h_usd: number | null;
  hl_mark_price: number | null;
  hl_max_leverage: number | null;

  // DEXScreener (DEX liquidity)
  dex_total_liquidity_usd: number | null;
  dex_pair_count: number | null;
  dex_top_pair_address: string | null;
  dex_top_pair_chain: string | null;
  dex_top_pair_volume_24h: number | null;

  // Aggregate quality
  audit_count: number | null;
  funding_total_usd: number | null;
  funding_latest_round: string | null;
  funding_latest_date: string | null;
  funding_latest_valuation_usd: number | null;
  funding_round_count: number;
  github_stars: number | null;
  github_forks: number | null;
  github_subscribers: number | null;
  twitter_followers: number | null;
  reddit_subscribers: number | null;
  telegram_users: number | null;
  hack_count: number;
  hack_total_lost_usd: number | null;
  exchange_listing_count: number;
  has_fsa_warning_exchange: boolean;

  // Tier
  tier: Tier | null;
  tier_score: number | null;
  tier_updated_at: string | null;

  // Source tracking
  last_ingest_coingecko: string | null;
  last_ingest_defillama: string | null;
  last_ingest_cryptorank: string | null;
  last_ingest_tokenomist: string | null;
  last_ingest_tokenterminal: string | null;
  last_ingest_lunarcrush: string | null;
  last_ingest_dexscreener: string | null;
  last_ingest_hyperliquid: string | null;
  last_ingest_rootdata: string | null;

  // Generic metadata
  signals_metadata: Record<string, unknown>;

  // Status
  is_active: boolean;
  source: string;
  primary_source_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoinTranslation {
  coin_id: string;
  locale: Locale;
  summary: string | null;
  description: string | null;
  tagline: string | null;
  generated_by: string;
  generated_at: string;
  is_reviewed: boolean;
}

export interface VcFund {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  focus: string[];
  portfolio_count: number;
  total_invested_usd: number | null;
  website: string | null;
  twitter_url: string | null;
  description: Record<Locale, string> | null;
  is_asia: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface FundingRound {
  id: string;
  coin_id: string;
  round_type: string | null;
  amount_usd: number | null;
  valuation_usd: number | null;
  date: string | null;
  lead_investor_id: string | null;
  source: string | null;
  source_url: string | null;
  created_at: string;
}

export interface TokenUnlock {
  id: string;
  coin_id: string;
  unlock_date: string;
  amount: number;
  percentage_of_supply: number | null;
  category: string | null;
  historical_impact_pct: number | null;
  source: string | null;
  created_at: string;
}

export interface IdoEvent {
  id: string;
  coin_id: string;
  exchange: string | null;
  start_date: string | null;
  end_date: string | null;
  initial_price: number | null;
  raise_amount_usd: number | null;
  participants: number | null;
  roi_data: { current_roi?: number; ath_roi?: number } | null;
  source: string | null;
  created_at: string;
}

export interface Hack {
  id: string;
  coin_id: string | null;
  protocol_name: string | null;
  date: string;
  amount_lost_usd: number | null;
  root_cause: string | null;
  description: Record<Locale, string> | null;
  source_urls: string[];
  is_recovered: boolean;
  created_at: string;
}

export interface Exchange {
  id: string;
  name: string;
  country: string | null;
  fsa_warning: boolean;
  app_store_jp: boolean;
  affiliate_url: string | null;
  affiliate_rate: string | null;
  created_at: string;
}

export interface TierEvaluation {
  id: string;
  coin_id: string;
  tier: Tier;
  total_score: number;
  liquidity_score: number | null;
  team_score: number | null;
  technology_score: number | null;
  community_score: number | null;
  regulatory_score: number | null;
  future_score: number | null;
  reasoning: Record<string, unknown> | null;
  llm_model: string;
  evaluated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  preferred_locale: Locale;
  preferred_currency: string;
  privy_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  billing_cycle: BillingCycle | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Generic catch-all row type for tables not yet hand-typed (affiliate_*, llm_usage_logs 等).
 *
 * 実運用では `supabase gen types typescript --schema cointier` で完全自動生成する。
 * 当面はこの fallback で `from('table_x').select('*')` 等を `Record<string, unknown>` として通す.
 */
type GenericTable = {
  Row: Record<string, unknown> & { id?: string; created_at?: string; updated_at?: string };
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

/**
 * Supabase TypeScript Database type (簡略版)
 *
 * 全テーブルは Postgres の `cointier` schema に存在する (`appexx-studio` プロジェクト内に
 * schema isolation で配置). このため top-level key は `cointier` (not `public`).
 * 実運用では `supabase gen types typescript --schema cointier` で完全自動生成する.
 */
export interface Database {
  cointier: {
    Tables: {
      coins: { Row: Coin; Insert: Partial<Coin>; Update: Partial<Coin> };
      coin_translations: { Row: CoinTranslation; Insert: Partial<CoinTranslation>; Update: Partial<CoinTranslation> };
      vc_funds: { Row: VcFund; Insert: Partial<VcFund>; Update: Partial<VcFund> };
      funding_rounds: { Row: FundingRound; Insert: Partial<FundingRound>; Update: Partial<FundingRound> };
      token_unlocks: { Row: TokenUnlock; Insert: Partial<TokenUnlock>; Update: Partial<TokenUnlock> };
      ido_events: { Row: IdoEvent; Insert: Partial<IdoEvent>; Update: Partial<IdoEvent> };
      hacks: { Row: Hack; Insert: Partial<Hack>; Update: Partial<Hack> };
      exchanges: { Row: Exchange; Insert: Partial<Exchange>; Update: Partial<Exchange> };
      tier_evaluations: { Row: TierEvaluation; Insert: Partial<TierEvaluation>; Update: Partial<TierEvaluation> };
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription> };
      // 詳細型は未定義. Generic fallback で `from('xxx').select('*')` を通す.
      llm_usage_logs: GenericTable;
      affiliate_links: GenericTable;
      affiliate_partners: GenericTable;
      affiliate_clicks: GenericTable;
      affiliate_conversions: GenericTable;
      attribution_sessions: GenericTable;
      watchlists: GenericTable;
      alerts: GenericTable;
      portfolios: GenericTable;
      transactions: GenericTable;
      pclaim_applications: GenericTable;
      coin_reviews: GenericTable;
    };
  };
  // PostgREST 公開用 alias (Supabase Dashboard で `cointier` を Exposed schemas に追加した後は
  // public からも見える形になる場合がある — 互換性のため空 stub を残す)
  public: {
    Tables: Record<string, GenericTable>;
  };
}
