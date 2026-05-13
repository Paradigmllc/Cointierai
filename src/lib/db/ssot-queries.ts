/**
 * SSOT query helpers. Every page that previously did live-fetch now calls
 * one of these helpers instead — they all hit cointier.* tables directly.
 *
 * If a function returns an empty array / null, the ingest job for that
 * source hasn't run yet. Callers should render the existing empty-state
 * (never re-fetch live, per永久ルール #0).
 */
import { createServiceSupabase } from '@/lib/db/supabase';

const supabase = () => createServiceSupabase();

// ---------- DEX pairs ----------
export interface DexPairRow {
  pair_address: string;
  chain_id: string;
  dex_id: string | null;
  base_symbol: string;
  quote_symbol: string | null;
  coin_id: string | null;
  price_usd: number | null;
  liquidity_usd: number | null;
  volume_24h_usd: number | null;
  price_change_24h: number | null;
  txns_24h_buys: number | null;
  txns_24h_sells: number | null;
  fdv_usd: number | null;
  url: string | null;
  fetched_at: string;
}

export async function getTopDexPairsForCoin(coinId: string, limit = 12): Promise<DexPairRow[]> {
  const { data } = await supabase()
    .from('dex_pairs')
    .select('*')
    .eq('coin_id', coinId)
    .order('liquidity_usd', { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as DexPairRow[];
}

export async function getTrendingDexPairs(limit = 50): Promise<DexPairRow[]> {
  // Trending = high volume / liquidity turnover.
  const { data } = await supabase()
    .from('dex_pairs')
    .select('*')
    .gt('liquidity_usd', 100_000)
    .gt('volume_24h_usd', 50_000)
    .order('volume_24h_usd', { ascending: false })
    .limit(limit);
  return (data ?? []) as DexPairRow[];
}

// ---------- News ----------
export interface NewsRow {
  id: number;
  title: string;
  url: string;
  published_at: string;
  source_title: string | null;
  source_domain: string | null;
  currencies: string[] | null;
  filter: string | null;
  sentiment_score: number | null;
  votes_positive: number;
  votes_negative: number;
  votes_important: number;
}

export async function getCoinNewsFromDb(symbol: string, limit = 20): Promise<NewsRow[]> {
  const { data } = await supabase()
    .from('news_articles')
    .select('*')
    .contains('currencies', [symbol.toUpperCase()])
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as NewsRow[];
}

export async function getGlobalNews(filter: string = 'hot', limit = 30): Promise<NewsRow[]> {
  const q = supabase().from('news_articles').select('*').order('published_at', { ascending: false }).limit(limit);
  if (filter && filter !== 'all') q.eq('filter', filter);
  const { data } = await q;
  return (data ?? []) as NewsRow[];
}

// ---------- Derivatives ----------
export interface DerivativesSnapshotRow {
  symbol: string;
  snapshot_at: string;
  funding_rate: number | null;
  funding_rate_apr: number | null;
  open_interest_usd: number | null;
  open_interest_change_24h: number | null;
  long_short_ratio: number | null;
  liquidations_24h_usd: number | null;
  liquidations_long_usd: number | null;
  liquidations_short_usd: number | null;
}

export async function getDerivativesHistory(symbol: string, limit = 168): Promise<DerivativesSnapshotRow[]> {
  const { data } = await supabase()
    .from('derivatives_snapshots')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .order('snapshot_at', { ascending: false })
    .limit(limit);
  return ((data ?? []) as DerivativesSnapshotRow[]).reverse(); // chronological
}

// ---------- Holders ----------
export interface HoldersSnapshotRow {
  coin_id: string;
  chain: string;
  total_holders: number | null;
  top10_concentration_pct: number | null;
  top1_pct: number | null;
  top1_address: string | null;
  top1_label: string | null;
  holders_jsonb: Array<{ rank: number; address: string; pct: number; amount: number; label?: string }> | null;
  snapshot_at: string;
}

export async function getLatestHolders(coinId: string): Promise<HoldersSnapshotRow | null> {
  const { data } = await supabase()
    .from('holders_snapshots')
    .select('*')
    .eq('coin_id', coinId)
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as HoldersSnapshotRow | null;
}

// ---------- Developer ----------
export interface DeveloperStatsRow {
  coin_id: string;
  repo_slug: string | null;
  stars: number | null;
  forks: number | null;
  watchers: number | null;
  subscribers: number | null;
  open_issues: number | null;
  contributors: number | null;
  language: string | null;
  pushed_at: string | null;
  weekly_commits: number[] | null;
}

export async function getDeveloperStats(coinId: string): Promise<DeveloperStatsRow | null> {
  const { data } = await supabase().from('developer_stats').select('*').eq('coin_id', coinId).maybeSingle();
  return data as DeveloperStatsRow | null;
}

// ---------- Community ----------
export interface CommunityStatsRow {
  coin_id: string;
  twitter_followers: number | null;
  twitter_followers_change_7d: number | null;
  reddit_subscribers: number | null;
  telegram_members: number | null;
  discord_members: number | null;
  galaxy_score: number | null;
  alt_rank: number | null;
  social_volume_24h: number | null;
  sentiment: number | null;
}

export async function getCommunityStats(coinId: string): Promise<CommunityStatsRow | null> {
  const { data } = await supabase().from('community_stats').select('*').eq('coin_id', coinId).maybeSingle();
  return data as CommunityStatsRow | null;
}

// ---------- On-chain ----------
export interface OnchainMetricsRow {
  coin_id: string;
  active_addresses_24h: number | null;
  tx_count_24h: number | null;
  tx_volume_24h_usd: number | null;
  nvt_adjusted: number | null;
  ath_percent_down: number | null;
  cycle_low_percent_up: number | null;
  vladimir_club_cost_usd: number | null;
}

export async function getOnchainMetrics(coinId: string): Promise<OnchainMetricsRow | null> {
  const { data } = await supabase().from('onchain_metrics').select('*').eq('coin_id', coinId).maybeSingle();
  return data as OnchainMetricsRow | null;
}

// ---------- Team / Investors / Audits ----------
export interface TeamProfileRow {
  coin_id: string;
  tagline: string | null;
  category: string | null;
  sector: string | null;
  contributors_jsonb: Array<{ name: string; title: string }> | null;
  organizations_jsonb: Array<{ name: string }> | null;
  investors_jsonb: Array<{ name: string }> | null;
  audit_links: string[] | null;
}

export async function getTeamProfile(coinId: string): Promise<TeamProfileRow | null> {
  const { data } = await supabase().from('team_profiles').select('*').eq('coin_id', coinId).maybeSingle();
  return data as TeamProfileRow | null;
}

// ---------- Yields ----------
export interface YieldsPoolRow {
  pool_id: string;
  project: string;
  symbol: string;
  chain: string;
  tvl_usd: number;
  apy: number;
  apy_base: number | null;
  apy_reward: number | null;
  stablecoin: boolean;
  il_risk: string | null;
  exposure: string | null;
}

export async function getYieldsPools(limit = 200, filters: { chain?: string; stableOnly?: boolean } = {}): Promise<YieldsPoolRow[]> {
  let q = supabase().from('yields_pools').select('*').gt('tvl_usd', 100_000).gt('apy', 0).lt('apy', 1000).order('tvl_usd', { ascending: false }).limit(limit);
  if (filters.chain) q = q.eq('chain', filters.chain);
  if (filters.stableOnly) q = q.eq('stablecoin', true);
  const { data } = await q;
  return (data ?? []) as YieldsPoolRow[];
}

// ---------- Stablecoins ----------
export interface StablecoinAssetRow {
  id: number;
  name: string;
  symbol: string;
  peg_type: string | null;
  peg_mechanism: string | null;
  circulating_usd: number | null;
  circulating_prev_day_usd: number | null;
  circulating_prev_week_usd: number | null;
  circulating_prev_month_usd: number | null;
  price: number | null;
  depegged: boolean;
}

export async function getStablecoinAssets(limit = 100): Promise<StablecoinAssetRow[]> {
  const { data } = await supabase().from('stablecoin_assets').select('*').order('circulating_usd', { ascending: false }).limit(limit);
  return (data ?? []) as StablecoinAssetRow[];
}

// ---------- Bridges ----------
export interface BridgeRow {
  id: number;
  name: string;
  display_name: string | null;
  chains: string[];
  volume_prev_day_usd: number | null;
  volume_change_24h: number | null;
  txs_prev_day: number | null;
  url: string | null;
}

export async function getBridges(limit = 50): Promise<BridgeRow[]> {
  const { data } = await supabase().from('bridges').select('*').order('volume_prev_day_usd', { ascending: false }).limit(limit);
  return (data ?? []) as BridgeRow[];
}

// ---------- Exchanges ----------
export interface ExchangeRow {
  id: string;
  name: string;
  type: string;
  year_established: number | null;
  country: string | null;
  url: string;
  image: string;
  trust_score: number | null;
  trust_score_rank: number | null;
  trade_volume_24h_btc_normalized: number | null;
  open_interest_btc: number | null;
  number_of_perpetual_pairs: number | null;
  number_of_futures_pairs: number | null;
  fsa_warning: boolean;
  asia_regional: boolean;
  affiliate_code: string | null;
}

export async function getExchangesByType(type: 'spot' | 'derivatives', limit = 100): Promise<ExchangeRow[]> {
  const { data } = await supabase()
    .from('exchanges_index')
    .select('*')
    .eq('type', type)
    .order('trade_volume_24h_btc_normalized', { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as ExchangeRow[];
}

// ---------- DEX rankings ----------
export interface DexRankingRow {
  slug: string;
  name: string;
  logo: string | null;
  chains: string[];
  total_24h_usd: number | null;
  total_7d_usd: number | null;
  total_all_time_usd: number | null;
  change_1d: number | null;
  change_7d: number | null;
}

export async function getDexRankings(limit = 80): Promise<DexRankingRow[]> {
  const { data } = await supabase().from('dex_rankings').select('*').order('total_24h_usd', { ascending: false }).limit(limit);
  return (data ?? []) as DexRankingRow[];
}

// ---------- Compare articles (pSEO) ----------
export interface CompareArticleRow {
  coin_a: string;
  coin_b: string;
  locale: string;
  title: string | null;
  intro: string | null;
  verdict: string | null;
  bull_case_a: string | null;
  bear_case_a: string | null;
  bull_case_b: string | null;
  bear_case_b: string | null;
  comparison_table: { metrics: Array<{ label: string; a_value: string; b_value: string; winner: 'a' | 'b' | 'tie' }> } | null;
  faq: Array<{ q: string; a: string }> | null;
  generated_at: string;
}

export async function getCompareArticle(coinA: string, coinB: string, locale: string): Promise<CompareArticleRow | null> {
  // Normalise pair direction (alphabetical) so /btc-vs-eth and /eth-vs-btc hit the same row.
  const [a, b] = [coinA, coinB].sort();
  const { data } = await supabase()
    .from('compare_articles')
    .select('*')
    .eq('coin_a', a)
    .eq('coin_b', b)
    .eq('locale', locale)
    .maybeSingle();
  return data as CompareArticleRow | null;
}

// ---------- Coin verdicts (pSEO) ----------
export interface CoinVerdictRow {
  coin_id: string;
  locale: string;
  verdict: string | null;
  verdict_score: number | null;
  tldr: string | null;
  bull_case: Array<{ point: string; evidence_url?: string }> | null;
  bear_case: Array<{ point: string; evidence_url?: string }> | null;
  catalysts: Array<{ title: string; date?: string; impact?: string }> | null;
  risk_factors: Array<{ factor: string }> | null;
  time_horizon: string | null;
  confidence: number | null;
  generated_at: string;
}

export async function getCoinVerdict(coinId: string, locale: string): Promise<CoinVerdictRow | null> {
  const { data } = await supabase().from('coin_verdicts').select('*').eq('coin_id', coinId).eq('locale', locale).maybeSingle();
  return data as CoinVerdictRow | null;
}
