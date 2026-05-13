-- =====================================================================
-- Migration 00003 — 日本国内取引所マッピング + Tier 別更新頻度 + Hacks 日本語化
-- =====================================================================
-- Notion 資料で見落としていた実装要件:
--   1. 国内取引所 (GMO/bitFlyer/Coincheck/SBI VC Trade 等) の銘柄上場マッピング
--   2. Tier A/B/C 更新頻度階層化
--   3. Hacks DB の日本語 description (DeFiLlama Hacks → AI 翻訳)
--   4. 取引所別銘柄上場確認 (coin_exchanges 充実)
-- =====================================================================

-- ============ 日本国内取引所追加 (金商法届出済) ============
INSERT INTO exchanges (id, name, country, fsa_warning, app_store_jp, affiliate_rate)
VALUES
  ('bitflyer',   'bitFlyer',   'JP', false, true,  '国内届出済 (金融庁登録)'),
  ('coincheck',  'Coincheck',  'JP', false, true,  '国内届出済'),
  ('gmo-coin',   'GMOコイン',   'JP', false, true,  '国内届出済'),
  ('bitbank',    'bitbank',    'JP', false, true,  '国内届出済'),
  ('sbi-vc',     'SBI VCトレード', 'JP', false, true,  '国内届出済'),
  ('dmm-bitcoin','DMM Bitcoin', 'JP', false, true,  '国内届出済'),
  ('rakuten-wallet', '楽天ウォレット', 'JP', false, true, '国内届出済'),
  ('huobi-japan', 'Huobi Japan', 'JP', false, true, '国内届出済'),
  ('kucoin-jp',  'KuCoin Japan', 'JP', false, true,  '国内届出済')
ON CONFLICT (id) DO NOTHING;

-- ============ Tier 別更新頻度 (Notion L184-188 反映) ============
ALTER TABLE coins ADD COLUMN IF NOT EXISTS update_tier text DEFAULT 'C'
  CHECK (update_tier IN ('A', 'B', 'C'));
COMMENT ON COLUMN coins.update_tier IS
  'A: 上位500 (価格毎時 / VC日次) / B: 500-5000 (価格日次 / VC週次) / C: 5K-37K (週次差分のみ)';

-- update_tier を rank から自動計算する関数 + trigger
CREATE OR REPLACE FUNCTION compute_update_tier()
RETURNS trigger AS $$
BEGIN
  IF NEW.rank IS NULL THEN
    NEW.update_tier := 'C';
  ELSIF NEW.rank <= 500 THEN
    NEW.update_tier := 'A';
  ELSIF NEW.rank <= 5000 THEN
    NEW.update_tier := 'B';
  ELSE
    NEW.update_tier := 'C';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_coins_update_tier ON coins;
CREATE TRIGGER set_coins_update_tier
  BEFORE INSERT OR UPDATE OF rank ON coins
  FOR EACH ROW EXECUTE FUNCTION compute_update_tier();

-- 既存行の update_tier を初期化
UPDATE coins SET update_tier =
  CASE
    WHEN rank IS NULL OR rank > 5000 THEN 'C'
    WHEN rank <= 500 THEN 'A'
    ELSE 'B'
  END;

CREATE INDEX IF NOT EXISTS idx_coins_update_tier ON coins (update_tier);

-- ============ Hacks DB の日本語化フィールド ============
-- 既存の description jsonb は十分なため利用継続。
-- DeepSeek V4 Pro 経由で en → ja/th/vi/id/zh-TW/ko に翻訳して description.ja 等に格納する。
-- 翻訳ステータス管理用フィールド追加:
ALTER TABLE hacks ADD COLUMN IF NOT EXISTS technique text;
ALTER TABLE hacks ADD COLUMN IF NOT EXISTS lessons_learned_ja text;
ALTER TABLE hacks ADD COLUMN IF NOT EXISTS lessons_learned_en text;
ALTER TABLE hacks ADD COLUMN IF NOT EXISTS translated_locales text[] DEFAULT '{}';

-- ============ 国内取引所への上場マッピング view (頻繁にクエリされる) ============
CREATE OR REPLACE VIEW coin_jp_exchange_availability AS
SELECT
  c.id AS coin_id,
  c.symbol,
  c.name,
  -- 国内取引所での上場有無 (bool 集計)
  bool_or(e.id = 'bitflyer')     AS on_bitflyer,
  bool_or(e.id = 'coincheck')    AS on_coincheck,
  bool_or(e.id = 'gmo-coin')     AS on_gmo_coin,
  bool_or(e.id = 'bitbank')      AS on_bitbank,
  bool_or(e.id = 'sbi-vc')       AS on_sbi_vc,
  bool_or(e.id = 'dmm-bitcoin')  AS on_dmm_bitcoin,
  bool_or(e.id = 'rakuten-wallet') AS on_rakuten,
  bool_or(e.id = 'huobi-japan')  AS on_huobi_jp,
  bool_or(e.id = 'kucoin-jp')    AS on_kucoin_jp,
  -- JP exchange count
  count(*) FILTER (WHERE e.country = 'JP') AS jp_exchange_count
FROM coins c
LEFT JOIN coin_exchanges ce ON ce.coin_id = c.id
LEFT JOIN exchanges e ON e.id = ce.exchange_id
WHERE c.is_active = true
GROUP BY c.id, c.symbol, c.name;

-- ============ Free→Pro 転換の壁: 残り N 件カウンター ============
-- VC 投資先 (Free は上位 3 件のみ表示・残りはぼかし)
CREATE OR REPLACE VIEW coin_vc_visibility AS
SELECT
  fr.coin_id,
  count(*) AS total_rounds,
  count(*) FILTER (WHERE row_num <= 3) AS free_visible,
  count(*) - count(*) FILTER (WHERE row_num <= 3) AS pro_only
FROM (
  SELECT
    coin_id,
    row_number() OVER (PARTITION BY coin_id ORDER BY date DESC NULLS LAST) AS row_num
  FROM funding_rounds
) fr
GROUP BY fr.coin_id;

-- ============ Polymarket 連携用テーブル ============
CREATE TABLE IF NOT EXISTS polymarket_markets (
  id              text PRIMARY KEY,            -- Polymarket market slug
  question        text NOT NULL,
  yes_price       numeric(5, 4),                -- 0.00 - 1.00 (¢ value)
  no_price        numeric(5, 4),
  volume_usd      numeric(36, 6),
  end_date        timestamptz,
  related_coin_id text REFERENCES coins(id),    -- BTC が $100K 超える? etc
  related_keywords text[],                      -- 関連検索用
  is_active       boolean NOT NULL DEFAULT true,
  external_url    text NOT NULL,
  question_ja     text,                         -- 日本語訳
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_polymarket_coin ON polymarket_markets (related_coin_id) WHERE related_coin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_polymarket_active ON polymarket_markets (end_date) WHERE is_active = true;

ALTER TABLE polymarket_markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read polymarket" ON polymarket_markets FOR SELECT USING (is_active = true);
