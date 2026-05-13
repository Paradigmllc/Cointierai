/**
 * Coin Resolver — 外部 ID → Supabase coins.id 解決レイヤー
 *
 * 各データソースは異なる ID 体系を使う:
 *   - CoinGecko:  id (slug) "bitcoin"
 *   - CoinMarketCap: numeric id "1"
 *   - CryptoRank: key (slug) "bitcoin"
 *   - DeFiLlama:  slug "bitcoin"
 *   - Tokenomist: symbol "BTC"
 *   - Token Terminal: slug "bitcoin"
 *   - LunarCRUSH: id "1"
 *   - RootData:   project_id (numeric)
 *
 * Cointier の coins.id は CoinGecko id を採用 (最も広く使われる)。
 * ingestion 時に **symbol → coins.id resolution** を実行し、
 * 該当する coin に signal を materialize する。
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Database generic is intentionally omitted — `cointier` schema doesn't propagate through @supabase/ssr.
// Service client uses `db: { schema: 'cointier' }` so the 3rd generic param is "cointier"
// not "public". Use `<any, any, any>` to accept any schema configuration.
// Runtime queries return correct shapes; use sites cast as needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any, any, any>;

interface ResolveOptions {
  /** 一致しなかったら null を返す (default true). false の場合は最も近い候補を返す */
  strict?: boolean;
}

/**
 * Symbol で coin を解決 (大文字小文字無視)
 *   - 同じ symbol 持つ coin が複数ある場合は最高 market cap を返す
 */
export async function resolveBySymbol(
  supabase: Supabase,
  symbol: string,
  _opts: ResolveOptions = {},
): Promise<{ id: string; symbol: string } | null> {
  const lower = symbol.toLowerCase();
  const { data } = await supabase
    .from('coins')
    .select('id, symbol, market_cap_usd')
    .eq('symbol', lower)
    .order('market_cap_usd', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return data ? { id: data.id, symbol: data.symbol } : null;
}

/**
 * Slug で coin を解決 (CoinGecko id がそのまま使えるケース)
 */
export async function resolveBySlug(
  supabase: Supabase,
  slug: string,
): Promise<{ id: string; symbol: string } | null> {
  const normalized = slug.toLowerCase().trim();
  const { data } = await supabase
    .from('coins')
    .select('id, symbol')
    .eq('id', normalized)
    .maybeSingle();
  return data;
}

/**
 * 既存の DB column (defillama_slug / cryptorank_id / etc) で逆引き
 */
export async function resolveByExternalId(
  supabase: Supabase,
  source: 'defillama_slug' | 'cryptorank_id' | 'tokenterminal_slug' | 'rootdata_project_id' | 'lunarcrush_id' | 'cmc_id',
  value: string | number,
): Promise<{ id: string; symbol: string } | null> {
  const { data } = await supabase
    .from('coins')
    .select('id, symbol')
    .eq(source, value)
    .maybeSingle();
  return data;
}

/**
 * 複合解決 — symbol を優先しつつ、外部 id mapping を試す
 *
 * 使用例:
 *   const coin = await resolveCoin(supabase, { symbol: 'BTC', defillamaSlug: 'bitcoin' });
 *   if (!coin) skip;
 */
export async function resolveCoin(
  supabase: Supabase,
  input: {
    symbol?: string;
    name?: string;
    defillamaSlug?: string;
    cryptorankSlug?: string;
    tokenterminalSlug?: string;
    rootdataProjectId?: number;
    lunarcrushId?: number;
  },
): Promise<{ id: string; symbol: string } | null> {
  // Priority 1: explicit external id mappings (already saved)
  if (input.defillamaSlug) {
    const r = await resolveByExternalId(supabase, 'defillama_slug', input.defillamaSlug);
    if (r) return r;
  }
  if (input.cryptorankSlug) {
    const r = await resolveByExternalId(supabase, 'cryptorank_id', input.cryptorankSlug);
    if (r) return r;
  }
  if (input.tokenterminalSlug) {
    const r = await resolveByExternalId(supabase, 'tokenterminal_slug', input.tokenterminalSlug);
    if (r) return r;
  }
  if (input.rootdataProjectId) {
    const r = await resolveByExternalId(supabase, 'rootdata_project_id', input.rootdataProjectId);
    if (r) return r;
  }
  if (input.lunarcrushId) {
    const r = await resolveByExternalId(supabase, 'lunarcrush_id', input.lunarcrushId);
    if (r) return r;
  }

  // Priority 2: symbol (most common ingestion key)
  if (input.symbol) {
    const r = await resolveBySymbol(supabase, input.symbol);
    if (r) return r;
  }

  // Priority 3: slug-as-id (CoinGecko style)
  if (input.defillamaSlug) {
    const r = await resolveBySlug(supabase, input.defillamaSlug);
    if (r) return r;
  }

  // Priority 4: name fuzzy match (fallback for edge cases)
  if (input.name) {
    const { data } = await supabase
      .from('coins')
      .select('id, symbol')
      .ilike('name', input.name)
      .order('market_cap_usd', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

/**
 * Bulk resolution — 大量データの ingestion で 1 リクエストにまとめる
 */
export async function bulkResolveSymbols(
  supabase: Supabase,
  symbols: string[],
): Promise<Map<string, string>> {
  const lower = symbols.map((s) => s.toLowerCase());
  const { data } = await supabase
    .from('coins')
    .select('id, symbol, market_cap_usd')
    .in('symbol', lower)
    .order('market_cap_usd', { ascending: false, nullsFirst: false });

  // 同じ symbol が複数 → 最高 market cap だけ採用
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (!map.has(row.symbol)) {
      map.set(row.symbol, row.id);
    }
  }
  return map;
}
