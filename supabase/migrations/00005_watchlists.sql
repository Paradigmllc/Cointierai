-- Watchlist + portfolio holdings tables.
-- RLS: only the owning user can read/write their own entries.

CREATE TABLE IF NOT EXISTS cointier.watchlists (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  PRIMARY KEY (user_id, coin_id)
);

ALTER TABLE cointier.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "watchlists_owner_select" ON cointier.watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "watchlists_owner_insert" ON cointier.watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlists_owner_delete" ON cointier.watchlists
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS watchlists_coin_idx ON cointier.watchlists(coin_id);

-- Portfolio holdings (manual entry: average price + amount).
CREATE TABLE IF NOT EXISTS cointier.holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coin_id text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  avg_cost_usd numeric,
  source text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cointier.holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "holdings_owner_all" ON cointier.holdings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS holdings_user_idx ON cointier.holdings(user_id, coin_id);
