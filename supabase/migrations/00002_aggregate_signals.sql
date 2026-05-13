-- =====================================================================
-- Migration 00002 — Multi-source aggregate signals
-- =====================================================================
-- 設計思想: BTC = 1 行に全データソースの signals を materialized
--   - CoinGecko (基本価格・MC・既存)
--   - DeFiLlama (TVL / Raises)
--   - CryptoRank (VC funding)
--   - Tokenomist (アンロック詳細)
--   - Token Terminal (P/E, P/S)
--   - LunarCRUSH (Social score)
--   - Hyperliquid (Perps)
--   - DEXScreener (DEX liquidity)
--   - RootData (アジア VC)
--
-- 例: SELECT * FROM coins WHERE id='bitcoin'
--   → CoinGecko price + DeFiLlama TVL + LunarCRUSH score +
--     Hyperliquid funding + Token Terminal P/E + ... 全部 1 行で取得
-- =====================================================================

-- ============ Source ID mapping (resolution に使用) ============
ALTER TABLE coins ADD COLUMN IF NOT EXISTS defillama_slug      text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS tokenterminal_slug  text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS rootdata_project_id integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS lunarcrush_id       integer;

-- ============ DeFiLlama signals ============
ALTER TABLE coins ADD COLUMN IF NOT EXISTS defillama_tvl_usd       numeric(36, 6);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS defillama_tvl_change_1d numeric(10, 4);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS defillama_tvl_change_7d numeric(10, 4);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS defillama_category      text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS defillama_chains        text[];

-- ============ Token Terminal (Fundamentals) ============
ALTER TABLE coins ADD COLUMN IF NOT EXISTS tt_revenue_30d_usd          numeric(36, 6);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS tt_revenue_annualized_usd   numeric(36, 6);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS tt_fees_30d_usd             numeric(36, 6);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS tt_pe_ratio                 numeric(10, 4);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS tt_ps_ratio                 numeric(10, 4);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS tt_pf_ratio                 numeric(10, 4);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS tt_active_users_30d         integer;

-- ============ LunarCRUSH (Social) ============
ALTER TABLE coins ADD COLUMN IF NOT EXISTS lc_galaxy_score        numeric(5, 2);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS lc_alt_rank            integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS lc_social_volume_24h   numeric(20, 4);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS lc_social_contributors integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS lc_sentiment           numeric(3, 2);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS lc_posts_active        integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS lc_interactions_24h    bigint;

-- ============ Hyperliquid (Perps) ============
ALTER TABLE coins ADD COLUMN IF NOT EXISTS hl_listed              boolean DEFAULT false;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS hl_funding_rate        numeric(10, 8);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS hl_open_interest_usd   numeric(36, 6);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS hl_volume_24h_usd      numeric(36, 6);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS hl_mark_price          numeric(36, 18);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS hl_max_leverage        integer;

-- ============ DEXScreener (DEX liquidity) ============
ALTER TABLE coins ADD COLUMN IF NOT EXISTS dex_total_liquidity_usd numeric(36, 6);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS dex_pair_count          integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS dex_top_pair_address    text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS dex_top_pair_chain      text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS dex_top_pair_volume_24h numeric(36, 6);

-- ============ Aggregate quality signals (CoinGecko details + cross-source) ============
ALTER TABLE coins ADD COLUMN IF NOT EXISTS audit_count                  integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS funding_total_usd            numeric(36, 6);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS funding_latest_round         text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS funding_latest_date          date;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS funding_latest_valuation_usd numeric(36, 6);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS funding_round_count          integer DEFAULT 0;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS github_stars                 integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS github_forks                 integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS github_subscribers           integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS twitter_followers            integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS reddit_subscribers           integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS telegram_users               integer;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS hack_count                   integer DEFAULT 0;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS hack_total_lost_usd          numeric(36, 6);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS exchange_listing_count       integer DEFAULT 0;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS has_fsa_warning_exchange     boolean DEFAULT false;

-- ============ Source tracking (last_ingest_<source>) ============
ALTER TABLE coins ADD COLUMN IF NOT EXISTS last_ingest_coingecko     timestamptz;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS last_ingest_defillama     timestamptz;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS last_ingest_cryptorank    timestamptz;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS last_ingest_tokenomist    timestamptz;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS last_ingest_tokenterminal timestamptz;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS last_ingest_lunarcrush    timestamptz;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS last_ingest_dexscreener   timestamptz;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS last_ingest_hyperliquid   timestamptz;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS last_ingest_rootdata      timestamptz;

-- ============ Generic metadata (source-specific extras) ============
ALTER TABLE coins ADD COLUMN IF NOT EXISTS signals_metadata jsonb DEFAULT '{}'::jsonb NOT NULL;

-- ============ Indexes (signal-based query 高速化) ============
CREATE INDEX IF NOT EXISTS idx_coins_defillama_tvl       ON coins (defillama_tvl_usd DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_coins_galaxy_score        ON coins (lc_galaxy_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_coins_hyperliquid_listed  ON coins (hl_listed) WHERE hl_listed = true;
CREATE INDEX IF NOT EXISTS idx_coins_pe_ratio            ON coins (tt_pe_ratio) WHERE tt_pe_ratio IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coins_funding_total       ON coins (funding_total_usd DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_coins_defillama_slug      ON coins (defillama_slug) WHERE defillama_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coins_tokenterminal_slug  ON coins (tokenterminal_slug) WHERE tokenterminal_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coins_signals_metadata    ON coins USING gin (signals_metadata);

-- ============ Aggregated freshness view (運用監視用) ============
CREATE OR REPLACE VIEW coin_data_freshness AS
SELECT
  id, symbol, name, rank,
  last_ingest_coingecko,
  last_ingest_defillama,
  last_ingest_cryptorank,
  last_ingest_tokenomist,
  last_ingest_tokenterminal,
  last_ingest_lunarcrush,
  last_ingest_dexscreener,
  last_ingest_hyperliquid,
  last_ingest_rootdata,
  -- Coverage score: 何ソースから取得されているか
  (
    (CASE WHEN last_ingest_coingecko     IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN last_ingest_defillama     IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN last_ingest_cryptorank    IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN last_ingest_tokenomist    IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN last_ingest_tokenterminal IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN last_ingest_lunarcrush    IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN last_ingest_dexscreener   IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN last_ingest_hyperliquid   IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN last_ingest_rootdata      IS NOT NULL THEN 1 ELSE 0 END)
  ) AS source_coverage
FROM coins
WHERE is_active = true
ORDER BY source_coverage DESC, rank ASC NULLS LAST;
