-- ============================================================================
-- 00006 — SSOT-FIRST migration. Adds 14 tables so every dataset we display is
-- backed by Supabase (per永久ルール #0).
--
-- All public-read tables grant anon SELECT; user-scoped tables enforce RLS.
-- Indexes prioritise listing pages (sort by 24h volume / market cap / time).
-- ============================================================================

-- ============================================================================
-- 1. DEX pairs (DexScreener ingest)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.dex_pairs (
  pair_address text NOT NULL,
  chain_id text NOT NULL,
  PRIMARY KEY (chain_id, pair_address),
  dex_id text,
  base_symbol text NOT NULL,
  base_address text,
  quote_symbol text,
  coin_id text,                   -- joins to cointier.coins(id)
  price_usd numeric,
  price_native numeric,
  liquidity_usd numeric,
  volume_24h_usd numeric,
  volume_1h_usd numeric,
  txns_24h_buys integer,
  txns_24h_sells integer,
  price_change_24h numeric,
  price_change_1h numeric,
  fdv_usd numeric,
  market_cap_usd numeric,
  pair_created_at timestamptz,
  url text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dex_pairs_coin_idx ON cointier.dex_pairs(coin_id, liquidity_usd DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS dex_pairs_volume_idx ON cointier.dex_pairs(volume_24h_usd DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS dex_pairs_chain_idx ON cointier.dex_pairs(chain_id, liquidity_usd DESC NULLS LAST);

-- ============================================================================
-- 2. News articles (CryptoPanic ingest)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.news_articles (
  id bigint PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL,
  published_at timestamptz NOT NULL,
  source_title text,
  source_domain text,
  currencies text[],            -- ['BTC', 'ETH']
  kind text,                    -- 'news' / 'media'
  filter text,                  -- 'hot' / 'rising' / 'bullish' / 'bearish' / 'important'
  votes_positive integer DEFAULT 0,
  votes_negative integer DEFAULT 0,
  votes_important integer DEFAULT 0,
  sentiment_score numeric,      -- (positive - negative) / max(positive + negative, 1)
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS news_published_idx ON cointier.news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS news_currencies_idx ON cointier.news_articles USING GIN(currencies);
CREATE INDEX IF NOT EXISTS news_filter_idx ON cointier.news_articles(filter, published_at DESC);

-- ============================================================================
-- 3. Derivatives history (Coinglass / Hyperliquid funding history snapshots)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.derivatives_snapshots (
  symbol text NOT NULL,
  snapshot_at timestamptz NOT NULL,
  PRIMARY KEY (symbol, snapshot_at),
  funding_rate numeric,          -- current 8h funding
  funding_rate_apr numeric,
  open_interest_usd numeric,
  open_interest_change_24h numeric,
  long_short_ratio numeric,
  liquidations_24h_usd numeric,
  liquidations_long_usd numeric,
  liquidations_short_usd numeric,
  taker_long_short_ratio numeric,
  source text NOT NULL DEFAULT 'coinglass'
);
CREATE INDEX IF NOT EXISTS derivatives_symbol_recent_idx ON cointier.derivatives_snapshots(symbol, snapshot_at DESC);

-- ============================================================================
-- 4. Holders snapshots (Etherscan v2 / Bitquery)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.holders_snapshots (
  coin_id text NOT NULL,
  chain text NOT NULL,
  contract_address text,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (coin_id, chain, snapshot_at),
  total_holders integer,
  top10_concentration_pct numeric,
  top1_pct numeric,
  top1_address text,
  top1_label text,
  holders_jsonb jsonb,           -- [{rank, address, pct, amount, label}, …]
  source text NOT NULL DEFAULT 'etherscan'
);
CREATE INDEX IF NOT EXISTS holders_coin_idx ON cointier.holders_snapshots(coin_id, snapshot_at DESC);

-- ============================================================================
-- 5. Developer stats (GitHub REST)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.developer_stats (
  coin_id text PRIMARY KEY,
  repo_slug text,                -- "bitcoin/bitcoin"
  stars integer,
  forks integer,
  watchers integer,
  subscribers integer,
  open_issues integer,
  contributors integer,
  language text,
  pushed_at timestamptz,
  weekly_commits integer[],      -- 52 entries
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. Community stats (Twitter / Reddit / Telegram / LunarCRUSH)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.community_stats (
  coin_id text PRIMARY KEY,
  twitter_followers integer,
  twitter_followers_change_7d numeric,
  reddit_subscribers integer,
  reddit_active_users integer,
  telegram_members integer,
  discord_members integer,
  galaxy_score numeric,
  alt_rank integer,
  social_volume_24h numeric,
  sentiment numeric,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. On-chain metrics (Messari + Glassnode-free)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.onchain_metrics (
  coin_id text PRIMARY KEY,
  active_addresses_24h numeric,
  tx_count_24h numeric,
  tx_volume_24h_usd numeric,
  nvt_adjusted numeric,
  ath_percent_down numeric,
  cycle_low_percent_up numeric,
  vladimir_club_cost_usd numeric,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. Team / Investors / Audits profile (Messari)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.team_profiles (
  coin_id text PRIMARY KEY,
  tagline text,
  category text,
  sector text,
  governance_details text,
  contributors_jsonb jsonb,      -- [{name, title}, …]
  organizations_jsonb jsonb,
  investors_jsonb jsonb,
  audit_links text[],
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9. Yields pools (DeFiLlama yields)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.yields_pools (
  pool_id text PRIMARY KEY,
  project text,
  symbol text,
  chain text,
  tvl_usd numeric,
  apy numeric,
  apy_base numeric,
  apy_reward numeric,
  stablecoin boolean DEFAULT false,
  il_risk text,                  -- 'no' / 'yes'
  exposure text,                 -- 'single' / 'multi'
  underlying_tokens text[],
  reward_tokens text[],
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS yields_tvl_idx ON cointier.yields_pools(tvl_usd DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS yields_apy_idx ON cointier.yields_pools(apy DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS yields_chain_idx ON cointier.yields_pools(chain, tvl_usd DESC NULLS LAST);

-- ============================================================================
-- 10. Stablecoin assets (DeFiLlama stablecoins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.stablecoin_assets (
  id integer PRIMARY KEY,
  name text NOT NULL,
  symbol text NOT NULL,
  gecko_id text,
  peg_type text,
  peg_mechanism text,
  circulating_usd numeric,
  circulating_prev_day_usd numeric,
  circulating_prev_week_usd numeric,
  circulating_prev_month_usd numeric,
  chain_breakdown_jsonb jsonb,   -- {ethereum: 50M, polygon: 10M}
  price numeric,
  depegged boolean GENERATED ALWAYS AS (abs(coalesce(price, 1.0) - 1.0) > 0.005) STORED,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stablecoin_supply_idx ON cointier.stablecoin_assets(circulating_usd DESC NULLS LAST);

-- ============================================================================
-- 11. Bridges (DeFiLlama bridges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.bridges (
  id integer PRIMARY KEY,
  name text NOT NULL,
  display_name text,
  icon text,
  url text,
  chains text[],
  destination_chain text,
  volume_prev_day_usd numeric,
  volume_prev_2day_usd numeric,
  volume_change_24h numeric,
  txs_prev_day integer,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bridges_volume_idx ON cointier.bridges(volume_prev_day_usd DESC NULLS LAST);

-- ============================================================================
-- 12. Exchanges index (CoinGecko /exchanges + /derivatives/exchanges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.exchanges_index (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,            -- 'spot' / 'derivatives'
  year_established integer,
  country text,
  url text,
  image text,
  trust_score integer,
  trust_score_rank integer,
  trade_volume_24h_btc numeric,
  trade_volume_24h_btc_normalized numeric,
  open_interest_btc numeric,     -- derivatives only
  number_of_perpetual_pairs integer,
  number_of_futures_pairs integer,
  fsa_warning boolean DEFAULT false, -- 金融庁警告対象
  asia_regional boolean DEFAULT false,
  affiliate_code text,           -- joins to cointier.affiliate_links.code
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exchanges_volume_idx ON cointier.exchanges_index(type, trade_volume_24h_btc_normalized DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS exchanges_trust_idx ON cointier.exchanges_index(trust_score DESC NULLS LAST);

-- ============================================================================
-- 13. DEX rankings (DeFiLlama /overview/dexs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.dex_rankings (
  slug text PRIMARY KEY,
  name text NOT NULL,
  logo text,
  category text,
  chains text[],
  total_24h_usd numeric,
  total_7d_usd numeric,
  total_30d_usd numeric,
  total_all_time_usd numeric,
  change_1d numeric,
  change_7d numeric,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dex_rankings_24h_idx ON cointier.dex_rankings(total_24h_usd DESC NULLS LAST);

-- ============================================================================
-- 14. Compare articles (pSEO 量産の核 — coin_a × coin_b × locale)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.compare_articles (
  coin_a text NOT NULL,
  coin_b text NOT NULL,
  locale text NOT NULL,
  PRIMARY KEY (coin_a, coin_b, locale),
  title text,
  intro text,                    -- "BTC と ETH の違いを 30 秒で…"
  verdict text,                  -- "結論: 長期保有なら BTC、DeFi 利用なら ETH"
  bull_case_a text,
  bear_case_a text,
  bull_case_b text,
  bear_case_b text,
  comparison_table jsonb,        -- {metrics: [{label, a_value, b_value, winner}]}
  faq jsonb,                     -- [{q, a}, …] for FAQPage schema
  model text DEFAULT 'deepseek-v4-pro',
  cached_tokens integer,
  generated_at timestamptz NOT NULL DEFAULT now(),
  reviewed boolean DEFAULT false
);
CREATE INDEX IF NOT EXISTS compare_articles_coin_a_idx ON cointier.compare_articles(coin_a, locale);
CREATE INDEX IF NOT EXISTS compare_articles_coin_b_idx ON cointier.compare_articles(coin_b, locale);

-- ============================================================================
-- 15. Coin verdicts (per-coin Bull/Bear AI analysis, 7 locales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cointier.coin_verdicts (
  coin_id text NOT NULL,
  locale text NOT NULL,
  PRIMARY KEY (coin_id, locale),
  verdict text,                  -- '今買うべき' / '様子見' / '売り検討' / '長期ホールド'
  verdict_score numeric,         -- -1 (strong sell) … +1 (strong buy)
  bull_case jsonb,               -- [{point, evidence_url}, …] up to 3
  bear_case jsonb,
  catalysts jsonb,               -- 1-3 upcoming events that could move price
  tldr text,                     -- 1-2 sentence summary for hero card
  risk_factors jsonb,
  time_horizon text,             -- '1d' / '1w' / '1m' / '6m+'
  confidence numeric,
  model text DEFAULT 'deepseek-v4-pro',
  cached_tokens integer,
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coin_verdicts_locale_idx ON cointier.coin_verdicts(locale, generated_at DESC);

-- ============================================================================
-- RLS — all read-anon. Writes restricted to service_role only (ingest jobs).
-- ============================================================================
DO $$
DECLARE
  tname text;
BEGIN
  FOR tname IN SELECT unnest(ARRAY[
    'dex_pairs', 'news_articles', 'derivatives_snapshots', 'holders_snapshots',
    'developer_stats', 'community_stats', 'onchain_metrics', 'team_profiles',
    'yields_pools', 'stablecoin_assets', 'bridges', 'exchanges_index',
    'dex_rankings', 'compare_articles', 'coin_verdicts'
  ]) LOOP
    EXECUTE format('ALTER TABLE cointier.%I ENABLE ROW LEVEL SECURITY', tname);
    EXECUTE format('DROP POLICY IF EXISTS "%s_anon_read" ON cointier.%I', tname, tname);
    EXECUTE format('CREATE POLICY "%s_anon_read" ON cointier.%I FOR SELECT TO anon, authenticated USING (true)', tname, tname);
  END LOOP;
END $$;
