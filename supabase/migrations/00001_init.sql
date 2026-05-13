-- =====================================================================
-- Cointier — Initial schema (M0/M1)
-- =====================================================================
-- 設計指針:
--   - 30K+ coins スケール対応 (BTREE/GIN index 完備)
--   - 多言語は coin_translations junction table (新規言語追加が ALTER 不要)
--   - RLS 全テーブル有効化 (MM ルール必須)
--   - 帰属表示用に data_sources テーブルで出所追跡
-- =====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 銘柄名全文検索

-- =====================================================================
-- Reference tables
-- =====================================================================

-- データソース帰属表示用 (CryptoRank/CoinGecko/DeFiLlama 等)
CREATE TABLE data_sources (
  id           text PRIMARY KEY,
  display_name text NOT NULL,
  url          text NOT NULL,
  license      text,
  required_attribution boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO data_sources (id, display_name, url, license, required_attribution) VALUES
  ('coingecko',   'CoinGecko',      'https://www.coingecko.com', 'Free + attribution', true),
  ('cryptorank',  'CryptoRank',     'https://cryptorank.io',     'BY-CC-SA (Basic)',    true),
  ('defillama',   'DeFiLlama',      'https://defillama.com',     'Open / attribution',  true),
  ('dexscreener', 'DEXScreener',    'https://dexscreener.com',   'Free commercial',     false),
  ('tokenomist',  'Tokenomist.ai',  'https://tokenomist.ai',     'Enterprise API',      true),
  ('rootdata',    'RootData',       'https://www.rootdata.com',  'Free + attribution',  true),
  ('tokenterminal','Token Terminal','https://tokenterminal.com', 'Free 500k req/mo',    true),
  ('hyperliquid', 'Hyperliquid',    'https://hyperliquid.xyz',   'Public API',          false),
  ('lunarcrush',  'LunarCRUSH',     'https://lunarcrush.com',    'Free tier',           true),
  ('messari',     'Messari',        'https://messari.io',        'Free endpoints',      true),
  ('selfreport',  'Self-reported',  '',                          'pClaim',              false);

-- チェーン (Ethereum / BSC / Solana / etc)
CREATE TABLE chains (
  id          text PRIMARY KEY,        -- 'ethereum' / 'bsc' / 'solana'
  name        text NOT NULL,
  symbol      text,
  chain_id    integer,                  -- EIP-155 chain id (EVM のみ)
  rpc_url     text,
  explorer_url text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- カテゴリ (DeFi / GameFi / Layer1 / etc)
CREATE TABLE categories (
  id           text PRIMARY KEY,        -- 'defi' / 'gaming' / 'layer-1'
  name         jsonb NOT NULL,           -- {ja: 'DeFi', en: 'DeFi', th: '...', ...}
  description  jsonb,
  parent_id    text REFERENCES categories(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- Coin master (30K+ rows)
-- =====================================================================
CREATE TABLE coins (
  id              text PRIMARY KEY,            -- CoinGecko id 優先 (例 'bitcoin', 'ethereum')
  cmc_id          integer,                      -- CoinMarketCap fallback id
  cryptorank_id   text,                         -- CryptoRank slug
  symbol          text NOT NULL,
  name            text NOT NULL,
  chain_id        text REFERENCES chains(id),
  contract_address text,
  image_url       text,
  website         text,
  whitepaper_url  text,
  github_url      text,
  twitter_url     text,
  telegram_url    text,
  discord_url     text,

  -- マスター情報 (Snapshot から毎日同期)
  rank            integer,
  price_usd       numeric(36, 18),
  market_cap_usd  numeric(36, 6),
  fdv_usd         numeric(36, 6),               -- Fully Diluted Valuation
  volume_24h_usd  numeric(36, 6),
  circulating_supply numeric(36, 6),
  total_supply    numeric(36, 6),
  max_supply      numeric(36, 6),
  ath_usd         numeric(36, 18),
  ath_date        timestamptz,
  atl_usd         numeric(36, 18),
  atl_date        timestamptz,
  change_1h       numeric(10, 4),                -- %
  change_24h      numeric(10, 4),
  change_7d       numeric(10, 4),
  change_30d      numeric(10, 4),
  change_1y       numeric(10, 4),

  -- Tier 評価 (AI 算出・detail は tier_evaluations へ)
  tier            char(1),                       -- 'S'/'A'/'B'/'C'/'D'/'F'
  tier_score      numeric(5, 2),                 -- 0-100
  tier_updated_at timestamptz,

  -- Status
  is_active       boolean NOT NULL DEFAULT true,
  source          text NOT NULL DEFAULT 'coingecko' REFERENCES data_sources(id),
  primary_source_id text,                        -- source-specific id

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coins_rank ON coins (rank) WHERE rank IS NOT NULL;
CREATE INDEX idx_coins_market_cap ON coins (market_cap_usd DESC NULLS LAST);
CREATE INDEX idx_coins_volume ON coins (volume_24h_usd DESC NULLS LAST);
CREATE INDEX idx_coins_tier ON coins (tier);
CREATE INDEX idx_coins_symbol ON coins (lower(symbol));
CREATE INDEX idx_coins_name_trgm ON coins USING gin (name gin_trgm_ops);
CREATE INDEX idx_coins_active ON coins (is_active) WHERE is_active = true;

-- Coin × Category (多対多)
CREATE TABLE coin_categories (
  coin_id     text REFERENCES coins(id) ON DELETE CASCADE,
  category_id text REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (coin_id, category_id)
);
CREATE INDEX idx_coin_categories_category ON coin_categories (category_id);

-- =====================================================================
-- 多言語コンテンツ (junction table — 新言語追加が ALTER 不要)
-- =====================================================================
CREATE TABLE coin_translations (
  coin_id        text REFERENCES coins(id) ON DELETE CASCADE,
  locale         text NOT NULL,         -- 'ja' / 'en' / 'th' / 'vi' / 'id' / 'zh-TW' / 'ko'
  summary        text,                   -- 200 文字以内の AI 解説
  description    text,                   -- 長文 (whitepaper 要約等)
  tagline        text,
  generated_by   text DEFAULT 'deepseek-v4-pro',
  generated_at   timestamptz NOT NULL DEFAULT now(),
  is_reviewed    boolean NOT NULL DEFAULT false,
  PRIMARY KEY (coin_id, locale)
);

-- =====================================================================
-- Price history (日次 snapshot)
-- =====================================================================
CREATE TABLE coin_metrics_daily (
  coin_id        text REFERENCES coins(id) ON DELETE CASCADE,
  date           date NOT NULL,
  price_usd      numeric(36, 18),
  market_cap_usd numeric(36, 6),
  volume_24h_usd numeric(36, 6),
  PRIMARY KEY (coin_id, date)
);
CREATE INDEX idx_metrics_daily_date ON coin_metrics_daily (date DESC);

-- =====================================================================
-- VC 資金調達
-- =====================================================================
CREATE TABLE vc_funds (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  country       text,                    -- 'JP' / 'US' / 'SG' / 'HK' / etc
  focus         text[],                  -- ['defi', 'gamefi', 'infra']
  portfolio_count integer DEFAULT 0,
  total_invested_usd numeric(36, 6),
  website       text,
  twitter_url   text,
  description   jsonb,                    -- {ja:..., en:..., ...}
  is_asia       boolean NOT NULL DEFAULT false,  -- アジア特化フラグ (RootData 用)
  source        text REFERENCES data_sources(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vc_funds_country ON vc_funds (country);
CREATE INDEX idx_vc_funds_asia ON vc_funds (is_asia) WHERE is_asia = true;

CREATE TABLE funding_rounds (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin_id       text REFERENCES coins(id) ON DELETE CASCADE,
  round_type    text,                     -- 'seed' / 'series_a' / 'private' / 'public' / 'strategic'
  amount_usd    numeric(36, 6),
  valuation_usd numeric(36, 6),
  date          date,
  lead_investor_id uuid REFERENCES vc_funds(id),
  source        text REFERENCES data_sources(id),
  source_url    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_funding_rounds_coin ON funding_rounds (coin_id);
CREATE INDEX idx_funding_rounds_date ON funding_rounds (date DESC);

-- Round × Investor 多対多
CREATE TABLE funding_round_investors (
  round_id      uuid REFERENCES funding_rounds(id) ON DELETE CASCADE,
  vc_fund_id    uuid REFERENCES vc_funds(id) ON DELETE CASCADE,
  is_lead       boolean NOT NULL DEFAULT false,
  PRIMARY KEY (round_id, vc_fund_id)
);

-- =====================================================================
-- Token unlocks (Tokenomist + DeFiLlama)
-- =====================================================================
CREATE TABLE token_unlocks (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin_id       text REFERENCES coins(id) ON DELETE CASCADE,
  unlock_date   timestamptz NOT NULL,
  amount        numeric(36, 6) NOT NULL,
  percentage_of_supply numeric(10, 4),  -- アンロック量 / 流通量比率
  category      text,                    -- 'team' / 'investors' / 'ecosystem' / 'public'
  historical_impact_pct numeric(10, 4),  -- 過去同条件での平均価格影響
  source        text REFERENCES data_sources(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_unlocks_coin_date ON token_unlocks (coin_id, unlock_date);
CREATE INDEX idx_unlocks_date ON token_unlocks (unlock_date) WHERE unlock_date > now();

-- =====================================================================
-- IDO / IEO events
-- =====================================================================
CREATE TABLE ido_events (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin_id       text REFERENCES coins(id) ON DELETE CASCADE,
  exchange      text,                     -- 'binance-launchpad' / 'coinlist' / etc
  start_date    timestamptz,
  end_date      timestamptz,
  initial_price numeric(36, 18),
  raise_amount_usd numeric(36, 6),
  participants  integer,
  roi_data      jsonb,                    -- {current_roi: x, ath_roi: y, ...}
  source        text REFERENCES data_sources(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ido_start ON ido_events (start_date DESC);
CREATE INDEX idx_ido_coin ON ido_events (coin_id);

-- =====================================================================
-- Hacks / Exploits (DeFiLlama Hacks DB → 日本語化)
-- =====================================================================
CREATE TABLE hacks (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin_id         text REFERENCES coins(id),
  protocol_name   text,
  date            date NOT NULL,
  amount_lost_usd numeric(36, 6),
  root_cause      text,                   -- 'reentrancy' / 'oracle' / 'private_key' / etc
  description     jsonb,                   -- {ja:..., en:..., ...}
  source_urls     text[],
  is_recovered    boolean DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hacks_date ON hacks (date DESC);

-- =====================================================================
-- Exchanges
-- =====================================================================
CREATE TABLE exchanges (
  id            text PRIMARY KEY,         -- 'bingx' / 'mexc' / 'bitget' / 'binance'
  name          text NOT NULL,
  country       text,
  fsa_warning   boolean NOT NULL DEFAULT false,  -- 日本金融庁警告フラグ
  app_store_jp  boolean NOT NULL DEFAULT true,
  affiliate_url text,                       -- アフィリ link テンプレ
  affiliate_rate text,                      -- '40% lifetime' / etc
  created_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO exchanges (id, name, country, fsa_warning, app_store_jp, affiliate_rate) VALUES
  ('bingx',     'BingX',     'SG', false, true,  '$4,500 + commission'),
  ('mexc',      'MEXC',      'SG', true,  false, '40% lifetime 3 years'),
  ('bitget',    'Bitget',    'SG', true,  false, '$6,200 signup bonus'),
  ('kucoin',    'KuCoin',    'SG', true,  false, 'commission share'),
  ('binance',   'Binance',   'GLOBAL', false, false, 'JP-restricted'),
  ('coinbase',  'Coinbase',  'US', false, true,  'varies by country'),
  ('kraken',    'Kraken',    'US', false, true,  'varies'),
  ('okx',       'OKX',       'SG', false, false, 'JP-restricted'),
  ('hashkey',   'HashKey',   'HK', false, true,  'HK regulated'),
  ('coins-ph',  'Coins.ph',  'PH', false, true,  'PH national leader'),
  ('coindcx',   'CoinDCX',   'IN', false, true,  'India leader'),
  ('bitkub',    'Bitkub',    'TH', false, true,  'Thailand national'),
  ('indodax',   'Indodax',   'ID', false, true,  'Indonesia leader');

CREATE TABLE coin_exchanges (
  coin_id      text REFERENCES coins(id) ON DELETE CASCADE,
  exchange_id  text REFERENCES exchanges(id) ON DELETE CASCADE,
  trading_pair text,
  volume_24h_usd numeric(36, 6),
  PRIMARY KEY (coin_id, exchange_id, trading_pair)
);

-- =====================================================================
-- Tier evaluations (6 軸 AI 評価の詳細)
-- =====================================================================
CREATE TABLE tier_evaluations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin_id         text REFERENCES coins(id) ON DELETE CASCADE,
  tier            char(1) NOT NULL,
  total_score     numeric(5, 2) NOT NULL,
  liquidity_score numeric(5, 2),
  team_score      numeric(5, 2),
  technology_score numeric(5, 2),
  community_score numeric(5, 2),
  regulatory_score numeric(5, 2),
  future_score    numeric(5, 2),
  reasoning       jsonb,                    -- {factor: 'liquidity', evidence: [...], notes: ...}
  llm_model       text DEFAULT 'deepseek/deepseek-v4-pro',
  evaluated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tier_eval_coin_date ON tier_evaluations (coin_id, evaluated_at DESC);

-- =====================================================================
-- Users / Subscriptions
-- =====================================================================
CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text,
  display_name    text,
  preferred_locale text NOT NULL DEFAULT 'ja',
  preferred_currency text NOT NULL DEFAULT 'USD',
  privy_user_id   text UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  plan            text NOT NULL CHECK (plan IN ('free', 'pro', 'business')),
  billing_cycle   text CHECK (billing_cycle IN ('monthly', 'yearly')),
  status          text NOT NULL,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subs_user ON subscriptions (user_id);
CREATE INDEX idx_subs_status ON subscriptions (status) WHERE status = 'active';

-- Wallet 接続 (Privy + Builder Fee 承認状態)
CREATE TABLE wallets (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  address         text NOT NULL,
  chain_id        text REFERENCES chains(id),
  is_primary      boolean NOT NULL DEFAULT false,
  connected_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (address, chain_id)
);
CREATE INDEX idx_wallets_user ON wallets (user_id);
CREATE INDEX idx_wallets_address ON wallets (lower(address));

CREATE TABLE builder_fee_approvals (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id       uuid REFERENCES wallets(id) ON DELETE CASCADE,
  builder_address text NOT NULL,
  max_fee_rate    numeric(10, 6) NOT NULL,
  protocol        text NOT NULL,            -- 'hyperliquid' / 'polymarket'
  approved_at     timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz
);
CREATE INDEX idx_builder_approvals_active ON builder_fee_approvals (wallet_id) WHERE revoked_at IS NULL;

-- =====================================================================
-- Portfolio / Trades / Tax (Pro 限定機能)
-- =====================================================================
CREATE TABLE portfolios (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  coin_id         text REFERENCES coins(id),
  amount          numeric(36, 18) NOT NULL,
  avg_price_usd   numeric(36, 18),
  source          text,                     -- 'manual' / 'wallet' / 'hyperliquid'
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_portfolios_user ON portfolios (user_id);

CREATE TABLE trades (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  coin_id         text REFERENCES coins(id),
  trade_type      text NOT NULL CHECK (trade_type IN ('buy', 'sell', 'transfer_in', 'transfer_out')),
  amount          numeric(36, 18) NOT NULL,
  price_usd       numeric(36, 18),
  fee_usd         numeric(36, 6),
  source          text,                     -- 'manual' / 'hyperliquid' / 'csv_import'
  source_tx_hash  text,
  executed_at     timestamptz NOT NULL,
  imported_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_trades_user_date ON trades (user_id, executed_at DESC);

CREATE TABLE tax_reports (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  fiscal_year     integer NOT NULL,
  jurisdiction    text NOT NULL DEFAULT 'JP',
  total_gain_jpy  numeric(20, 4),
  total_loss_jpy  numeric(20, 4),
  net_gain_jpy    numeric(20, 4),
  report_pdf_url  text,
  computed_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tax_user_year ON tax_reports (user_id, fiscal_year DESC);

CREATE TABLE watchlists (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  coin_id         text REFERENCES coins(id) ON DELETE CASCADE,
  added_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, coin_id)
);

CREATE TABLE alerts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  coin_id         text REFERENCES coins(id) ON DELETE CASCADE,
  alert_type      text NOT NULL,            -- 'price_above' / 'price_below' / 'unlock' / 'ido_listing'
  conditions      jsonb NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  last_triggered  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_alerts_active ON alerts (user_id) WHERE is_active = true;

-- =====================================================================
-- B2B (pClaim) + UGC
-- =====================================================================
CREATE TABLE pclaim_listings (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin_id         text REFERENCES coins(id),
  vc_fund_id      uuid REFERENCES vc_funds(id),
  plan            text NOT NULL CHECK (plan IN ('free', 'pro')),
  is_verified     boolean NOT NULL DEFAULT false,
  premium_until   timestamptz,
  claimer_user_id uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK ((coin_id IS NOT NULL) OR (vc_fund_id IS NOT NULL))
);

CREATE TABLE ugc_posts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  post_type       text NOT NULL,            -- 'ido_review' / 'analysis' / 'tutorial'
  related_coin_id text REFERENCES coins(id),
  slug            text UNIQUE NOT NULL,
  locale          text NOT NULL,
  title           text NOT NULL,
  content         text NOT NULL,
  is_published    boolean NOT NULL DEFAULT false,
  view_count      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ugc_published ON ugc_posts (is_published, locale) WHERE is_published = true;

-- =====================================================================
-- Operational tables
-- =====================================================================

-- LLM 使用ログ (OpenRouter cached_tokens 監視・初月実測用)
CREATE TABLE llm_usage_logs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint        text NOT NULL,            -- 'tier_eval' / 'summary' / 'tax_report' / etc
  model           text NOT NULL,            -- 'deepseek/deepseek-v4-pro' 等
  prompt_tokens   integer NOT NULL,
  cached_tokens   integer NOT NULL DEFAULT 0,
  cache_write_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL,
  total_cost_usd  numeric(12, 8),
  latency_ms      integer,
  user_id         uuid REFERENCES profiles(id),
  request_id      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_llm_logs_endpoint_date ON llm_usage_logs (endpoint, created_at DESC);
CREATE INDEX idx_llm_logs_model_date ON llm_usage_logs (model, created_at DESC);

-- API キー (Business plan 用)
CREATE TABLE api_keys (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  key_hash        text NOT NULL UNIQUE,
  key_prefix      text NOT NULL,            -- "ck_live_XX" の先頭表示用
  scope           text[] NOT NULL DEFAULT '{}',
  daily_limit     integer NOT NULL DEFAULT 10000,
  calls_today     integer NOT NULL DEFAULT 0,
  last_used_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz
);
CREATE INDEX idx_api_keys_active ON api_keys (key_hash) WHERE revoked_at IS NULL;

-- =====================================================================
-- 更新時刻自動更新トリガー
-- =====================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_coins_updated_at BEFORE UPDATE ON coins FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_vc_funds_updated_at BEFORE UPDATE ON vc_funds FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_ugc_posts_updated_at BEFORE UPDATE ON ugc_posts FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =====================================================================
-- Row Level Security (MM ルール必須・全テーブル有効化)
-- =====================================================================

-- Public read tables (誰でも参照可)
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_round_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ido_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON data_sources FOR SELECT USING (true);
CREATE POLICY "Public read" ON chains FOR SELECT USING (true);
CREATE POLICY "Public read" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read" ON coins FOR SELECT USING (is_active = true);
CREATE POLICY "Public read" ON coin_categories FOR SELECT USING (true);
CREATE POLICY "Public read" ON coin_translations FOR SELECT USING (true);
CREATE POLICY "Public read" ON coin_metrics_daily FOR SELECT USING (true);
CREATE POLICY "Public read" ON vc_funds FOR SELECT USING (true);
CREATE POLICY "Public read" ON funding_rounds FOR SELECT USING (true);
CREATE POLICY "Public read" ON funding_round_investors FOR SELECT USING (true);
CREATE POLICY "Public read" ON token_unlocks FOR SELECT USING (true);
CREATE POLICY "Public read" ON ido_events FOR SELECT USING (true);
CREATE POLICY "Public read" ON hacks FOR SELECT USING (true);
CREATE POLICY "Public read" ON exchanges FOR SELECT USING (true);
CREATE POLICY "Public read" ON coin_exchanges FOR SELECT USING (true);
CREATE POLICY "Public read" ON tier_evaluations FOR SELECT USING (true);
CREATE POLICY "Public read published UGC" ON ugc_posts FOR SELECT USING (is_published = true);

-- User-owned tables (本人のみ参照可)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_fee_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pclaim_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own profile read" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Own profile write" ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own wallets" ON wallets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own builder approvals" ON builder_fee_approvals FOR ALL
  USING (EXISTS (SELECT 1 FROM wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid()));
CREATE POLICY "Own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own trades" ON trades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own tax reports" ON tax_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own watchlists" ON watchlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own alerts" ON alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own API keys" ON api_keys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own pClaim" ON pclaim_listings FOR ALL USING (auth.uid() = claimer_user_id);
CREATE POLICY "Service-only LLM logs" ON llm_usage_logs FOR ALL USING (false);  -- service_role のみ書込み

-- UGC は自分の投稿のみ編集可
CREATE POLICY "Own UGC write" ON ugc_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own UGC update" ON ugc_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own UGC delete" ON ugc_posts FOR DELETE USING (auth.uid() = user_id);
