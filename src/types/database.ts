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
  id: string;
  cmc_id: number | null;
  cryptorank_id: string | null;
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
  tier: Tier | null;
  tier_score: number | null;
  tier_updated_at: string | null;
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
 * Supabase TypeScript Database type (簡略版)
 * 実運用では `supabase gen types typescript` で完全自動生成する
 */
export interface Database {
  public: {
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
    };
  };
}
