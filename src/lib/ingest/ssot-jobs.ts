/**
 * SSOT ingest jobs — one function per dataset.
 *
 * Each job is **idempotent** (upsert / replace) and returns a structured
 * summary so callers (cron API routes, CLI scripts) can log per-source counts.
 *
 * Frequency targets (set as Coolify cron):
 *   dex_pairs        every 5 min  (top 200 coins only — DEX moves fast)
 *   news_articles    every 15 min
 *   derivatives_*    every 15 min (Coinglass / Hyperliquid funding)
 *   holders_*        every 6 h    (Etherscan rate limits)
 *   developer_*      every 24 h   (GitHub stars don't move minute-by-minute)
 *   community_*      every 6 h    (LunarCRUSH free tier)
 *   onchain_metrics  every 6 h
 *   team_profiles    every 7 days (Messari profile is static)
 *   yields_pools     every 1 h
 *   stablecoins      every 1 h
 *   bridges          every 1 h
 *   exchanges_index  every 6 h
 *   dex_rankings     every 1 h
 */
import { createServiceSupabase } from '@/lib/db/supabase';
import { getCoinNews, getNews } from '@/lib/api/cryptopanic';
import { getFundingHistory, getOpenInterestHistory, getLongShortRatio, getLiquidations24h } from '@/lib/api/coinglass';
import { getTopHolders, getTokenInfo } from '@/lib/api/etherscan';
import { parseRepoSlug, getRepo, getCommitActivity, getContributorCount } from '@/lib/api/github';
import { getAssetMetrics, getAssetProfile } from '@/lib/api/messari';
import { getYieldPools, getStablecoinList, getBridges, getDexOverview } from '@/lib/api/defillama';
import { getExchanges, getDerivativeExchanges, getMarkets } from '@/lib/api/coingecko';
import { getTopPairs } from '@/lib/api/dexscreener';

export interface IngestSummary {
  source: string;
  ok: boolean;
  ms: number;
  rows: number;
  errors?: string[];
}

function start(source: string) {
  const t0 = Date.now();
  return (rows: number, errors?: string[]): IngestSummary => ({
    source,
    ok: !errors || errors.length === 0,
    ms: Date.now() - t0,
    rows,
    errors,
  });
}

// ============================================================================
// 1. DEX pairs — top 200 coins by market cap, each gets up to 12 pairs.
// ============================================================================
export async function ingestDexPairs(): Promise<IngestSummary> {
  const done = start('dex_pairs');
  const supabase = createServiceSupabase();
  const errors: string[] = [];
  let inserted = 0;
  const top = await getMarkets({ perPage: 200, sparkline: false }).catch(() => []);
  for (const coin of top) {
    const pairs = await getTopPairs(coin.symbol, 12).catch(() => []);
    if (pairs.length === 0) continue;
    const rows = pairs.map((p) => ({
      pair_address: p.pairAddress,
      chain_id: p.chainId,
      dex_id: p.dexId,
      base_symbol: p.baseToken.symbol,
      base_address: p.baseToken.address,
      quote_symbol: p.quoteToken.symbol,
      coin_id: coin.id,
      price_usd: p.priceUsd ? Number(p.priceUsd) : null,
      price_native: Number(p.priceNative),
      liquidity_usd: p.liquidity?.usd ?? null,
      volume_24h_usd: p.volume.h24,
      volume_1h_usd: p.volume.h1,
      txns_24h_buys: p.txns.h24.buys,
      txns_24h_sells: p.txns.h24.sells,
      price_change_24h: p.priceChange?.h24 ?? null,
      price_change_1h: p.priceChange?.h1 ?? null,
      fdv_usd: p.fdv ?? null,
      market_cap_usd: p.marketCap ?? null,
      pair_created_at: p.pairCreatedAt ? new Date(p.pairCreatedAt).toISOString() : null,
      url: p.url,
    }));
    const { error } = await supabase.from('dex_pairs').upsert(rows, { onConflict: 'chain_id,pair_address' });
    if (error) errors.push(`${coin.id}: ${error.message}`);
    else inserted += rows.length;
    await new Promise((r) => setTimeout(r, 250)); // DexScreener 300 req/min
  }
  return done(inserted, errors.length ? errors : undefined);
}

// ============================================================================
// 2. News — global hot/rising/bullish/bearish/important
// ============================================================================
export async function ingestNews(): Promise<IngestSummary> {
  const done = start('news_articles');
  const supabase = createServiceSupabase();
  const filters: Array<'hot' | 'rising' | 'bullish' | 'bearish' | 'important'> = ['hot', 'rising', 'bullish', 'bearish', 'important'];
  const errors: string[] = [];
  let inserted = 0;
  for (const filter of filters) {
    const posts = await getNews({ filter }).catch(() => []);
    if (posts.length === 0) continue;
    const rows = posts.map((p) => {
      const pos = p.votes?.positive ?? 0;
      const neg = p.votes?.negative ?? 0;
      return {
        id: p.id,
        title: p.title,
        url: p.url,
        published_at: p.published_at,
        source_title: p.source.title,
        source_domain: p.source.domain,
        currencies: p.currencies?.map((c) => c.code.toUpperCase()) ?? [],
        kind: p.kind,
        filter,
        votes_positive: pos,
        votes_negative: neg,
        votes_important: p.votes?.important ?? 0,
        sentiment_score: pos + neg > 0 ? (pos - neg) / (pos + neg) : 0,
      };
    });
    const { error } = await supabase.from('news_articles').upsert(rows, { onConflict: 'id' });
    if (error) errors.push(`${filter}: ${error.message}`);
    else inserted += rows.length;
  }
  return done(inserted, errors.length ? errors : undefined);
}

// ============================================================================
// 3. Derivatives snapshots — Coinglass funding / OI / longshort / liquidations
// ============================================================================
export async function ingestDerivatives(symbols: string[] = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'TRX', 'TON', 'AVAX', 'LINK']): Promise<IngestSummary> {
  const done = start('derivatives_snapshots');
  const supabase = createServiceSupabase();
  const errors: string[] = [];
  let inserted = 0;
  const snapshotAt = new Date().toISOString();
  for (const symbol of symbols) {
    try {
      const [funding, oi, lsr, liqs] = await Promise.all([
        getFundingHistory(symbol).then((arr) => arr[arr.length - 1] ?? null).catch(() => null),
        getOpenInterestHistory(symbol).then((arr) => arr[arr.length - 1] ?? null).catch(() => null),
        getLongShortRatio(symbol).then((arr) => arr[arr.length - 1] ?? null).catch(() => null),
        getLiquidations24h(symbol).catch(() => []),
      ]);
      const liqLong = liqs.reduce((s, x) => s + x.longLiquidationUsd, 0);
      const liqShort = liqs.reduce((s, x) => s + x.shortLiquidationUsd, 0);
      const fundingRate = funding?.fundingRate ?? null;
      const fundingApr = fundingRate != null ? fundingRate * (24 / 8) * 365 : null;
      const { error } = await supabase.from('derivatives_snapshots').upsert({
        symbol,
        snapshot_at: snapshotAt,
        funding_rate: fundingRate,
        funding_rate_apr: fundingApr,
        open_interest_usd: oi?.openInterest ?? null,
        long_short_ratio: lsr?.longShortRatio ?? null,
        liquidations_24h_usd: liqLong + liqShort,
        liquidations_long_usd: liqLong,
        liquidations_short_usd: liqShort,
      }, { onConflict: 'symbol,snapshot_at' });
      if (error) errors.push(`${symbol}: ${error.message}`);
      else inserted += 1;
    } catch (e) {
      errors.push(`${symbol}: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }
  return done(inserted, errors.length ? errors : undefined);
}

// ============================================================================
// 4. Holders — Etherscan v2 + DefiLlama price oracle
// ============================================================================
export async function ingestHolders(coinIds: string[]): Promise<IngestSummary> {
  const done = start('holders_snapshots');
  const supabase = createServiceSupabase();
  const errors: string[] = [];
  let inserted = 0;
  // We need (chain, contract_address) per coin — pull from cointier.coins
  const { data: coinRows } = await supabase.from('coins').select('id, chain_id, contract_address').in('id', coinIds);
  for (const coin of coinRows ?? []) {
    if (!coin.chain_id || !coin.contract_address) continue;
    try {
      const [holders, tokenInfo] = await Promise.all([
        getTopHolders(String(coin.chain_id), coin.contract_address, 10).catch(() => []),
        getTokenInfo(String(coin.chain_id), coin.contract_address).catch(() => null),
      ]);
      if (holders.length === 0) continue;
      const totalSupply = tokenInfo?.totalSupply && tokenInfo.divisor
        ? Number(tokenInfo.totalSupply) / Math.pow(10, Number(tokenInfo.divisor))
        : null;
      const ranked = holders.map((h, i) => {
        const amount = Number(h.TokenHolderQuantity);
        return {
          rank: i + 1,
          address: h.TokenHolderAddress,
          amount,
          pct: totalSupply && totalSupply > 0 ? (amount / totalSupply) * 100 : 0,
        };
      });
      const top10Pct = ranked.reduce((s, h) => s + h.pct, 0);
      const { error } = await supabase.from('holders_snapshots').insert({
        coin_id: coin.id,
        chain: String(coin.chain_id),
        contract_address: coin.contract_address,
        total_holders: tokenInfo?.holders ? Number(tokenInfo.holders) : null,
        top10_concentration_pct: top10Pct,
        top1_pct: ranked[0]?.pct ?? null,
        top1_address: ranked[0]?.address ?? null,
        holders_jsonb: ranked,
        source: 'etherscan',
      });
      if (error) errors.push(`${coin.id}: ${error.message}`);
      else inserted += 1;
    } catch (e) {
      errors.push(`${coin.id}: ${e instanceof Error ? e.message : 'unknown'}`);
    }
    await new Promise((r) => setTimeout(r, 220)); // 5 req/s
  }
  return done(inserted, errors.length ? errors : undefined);
}

// ============================================================================
// 5. Developer stats — GitHub stars/commits per coin
// ============================================================================
export async function ingestDeveloper(coinIds: string[]): Promise<IngestSummary> {
  const done = start('developer_stats');
  const supabase = createServiceSupabase();
  const errors: string[] = [];
  let inserted = 0;
  const { data: coins } = await supabase.from('coins').select('id, github_url').in('id', coinIds);
  for (const coin of coins ?? []) {
    const slug = parseRepoSlug(coin.github_url);
    if (!slug) continue;
    try {
      const [repo, activity, contributors] = await Promise.all([
        getRepo(slug),
        getCommitActivity(slug),
        getContributorCount(slug),
      ]);
      if (!repo) continue;
      const { error } = await supabase.from('developer_stats').upsert({
        coin_id: coin.id,
        repo_slug: slug,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        subscribers: repo.subscribers_count,
        open_issues: repo.open_issues_count,
        contributors,
        language: repo.language,
        pushed_at: repo.pushed_at,
        weekly_commits: activity ? activity.map((w) => w.total) : null,
      }, { onConflict: 'coin_id' });
      if (error) errors.push(`${coin.id}: ${error.message}`);
      else inserted += 1;
    } catch (e) {
      errors.push(`${coin.id}: ${e instanceof Error ? e.message : 'unknown'}`);
    }
    await new Promise((r) => setTimeout(r, 800)); // GitHub 5K req/h with token
  }
  return done(inserted, errors.length ? errors : undefined);
}

// ============================================================================
// 6. Onchain metrics + team profile (Messari batch)
// ============================================================================
export async function ingestMessari(coinIds: string[]): Promise<IngestSummary> {
  const done = start('onchain+team');
  const supabase = createServiceSupabase();
  const errors: string[] = [];
  let inserted = 0;
  for (const id of coinIds) {
    try {
      const [metrics, profile] = await Promise.all([getAssetMetrics(id), getAssetProfile(id)]);
      if (metrics) {
        await supabase.from('onchain_metrics').upsert({
          coin_id: id,
          active_addresses_24h: metrics.blockchain_stats_24_hours?.count_of_active_addresses ?? null,
          tx_volume_24h_usd: metrics.blockchain_stats_24_hours?.adjusted_transaction_volume ?? null,
          nvt_adjusted: metrics.blockchain_stats_24_hours?.adjusted_nvt ?? null,
          ath_percent_down: metrics.all_time_high?.percent_down ?? null,
          cycle_low_percent_up: metrics.cycle_low?.percent_up ?? null,
          vladimir_club_cost_usd: metrics.misc_data?.vladimir_club_cost ?? null,
        }, { onConflict: 'coin_id' });
      }
      if (profile) {
        const overview = profile.profile?.general?.overview;
        await supabase.from('team_profiles').upsert({
          coin_id: id,
          tagline: overview?.tagline ?? null,
          category: overview?.category ?? null,
          sector: overview?.sector ?? null,
          governance_details: profile.profile?.governance?.governance_details ?? null,
          contributors_jsonb: profile.profile?.contributors?.individuals ?? [],
          organizations_jsonb: profile.profile?.contributors?.organizations ?? [],
          investors_jsonb: profile.profile?.investors?.organizations ?? [],
          audit_links: [],
        }, { onConflict: 'coin_id' });
      }
      inserted += 1;
    } catch (e) {
      errors.push(`${id}: ${e instanceof Error ? e.message : 'unknown'}`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return done(inserted, errors.length ? errors : undefined);
}

// ============================================================================
// 7. Yields pools (DefiLlama)
// ============================================================================
export async function ingestYields(): Promise<IngestSummary> {
  const done = start('yields_pools');
  const supabase = createServiceSupabase();
  const { data: pools = [] } = await getYieldPools().catch(() => ({ data: [] as Array<Record<string, unknown>> }));
  const rows = pools
    .filter((p) => (p.tvlUsd as number) > 100_000 && (p.apy as number) > 0 && (p.apy as number) < 1_000)
    .slice(0, 500)
    .map((p) => ({
      pool_id: p.pool as string,
      project: p.project as string,
      symbol: p.symbol as string,
      chain: p.chain as string,
      tvl_usd: p.tvlUsd as number,
      apy: p.apy as number,
      apy_base: (p.apyBase as number) ?? null,
      apy_reward: (p.apyReward as number) ?? null,
      stablecoin: !!p.stablecoin,
      il_risk: (p.ilRisk as string) ?? null,
      exposure: (p.exposure as string) ?? null,
      underlying_tokens: (p.underlyingTokens as string[]) ?? [],
      reward_tokens: (p.rewardTokens as string[]) ?? [],
    }));
  const { error } = await supabase.from('yields_pools').upsert(rows, { onConflict: 'pool_id' });
  return done(rows.length, error ? [error.message] : undefined);
}

// ============================================================================
// 8. Stablecoins (DefiLlama)
// ============================================================================
export async function ingestStablecoins(): Promise<IngestSummary> {
  const done = start('stablecoin_assets');
  const supabase = createServiceSupabase();
  const { peggedAssets = [] } = await getStablecoinList().catch(() => ({ peggedAssets: [] }));
  const rows = peggedAssets.slice(0, 200).map((s) => ({
    id: s.id,
    name: s.name,
    symbol: s.symbol,
    gecko_id: s.gecko_id,
    peg_type: s.pegType,
    peg_mechanism: s.pegMechanism,
    circulating_usd: s.circulating?.peggedUSD ?? null,
    circulating_prev_day_usd: s.circulatingPrevDay?.peggedUSD ?? null,
    circulating_prev_week_usd: s.circulatingPrevWeek?.peggedUSD ?? null,
    circulating_prev_month_usd: s.circulatingPrevMonth?.peggedUSD ?? null,
    chain_breakdown_jsonb: s.chainCirculating ?? {},
    price: s.price ?? null,
  }));
  const { error } = await supabase.from('stablecoin_assets').upsert(rows, { onConflict: 'id' });
  return done(rows.length, error ? [error.message] : undefined);
}

// ============================================================================
// 9. Bridges (DefiLlama)
// ============================================================================
export async function ingestBridges(): Promise<IngestSummary> {
  const done = start('bridges');
  const supabase = createServiceSupabase();
  const { bridges = [] } = await getBridges().catch(() => ({ bridges: [] }));
  const rows = bridges.map((b) => ({
    id: b.id,
    name: b.name,
    display_name: b.displayName ?? null,
    icon: b.icon,
    url: b.url,
    chains: b.chains ?? [],
    destination_chain: b.destinationChain ?? null,
    volume_prev_day_usd: b.volumePrevDay ?? 0,
    volume_prev_2day_usd: b.volumePrev2Day ?? 0,
    volume_change_24h: b.volumePrev2Day > 0
      ? ((b.volumePrevDay - b.volumePrev2Day) / b.volumePrev2Day) * 100
      : null,
    txs_prev_day: b.txsPrevDay ?? 0,
  }));
  const { error } = await supabase.from('bridges').upsert(rows, { onConflict: 'id' });
  return done(rows.length, error ? [error.message] : undefined);
}

// ============================================================================
// 10. Exchanges (CoinGecko spot + derivatives)
// ============================================================================
export async function ingestExchanges(): Promise<IngestSummary> {
  const done = start('exchanges_index');
  const supabase = createServiceSupabase();
  const [spot, derivatives] = await Promise.all([
    getExchanges(1, 100).catch(() => []),
    getDerivativeExchanges().catch(() => []),
  ]);
  const FSA_WARNINGS = new Set(['binance', 'bybit', 'okx', 'mexc', 'bitget', 'kucoin']);
  const ASIA_REGIONAL = new Set(['bitkub', 'upbit', 'bithumb', 'coins_ph', 'pdax', 'coindcx', 'wazirx', 'hashkey']);
  const rows = [
    ...spot.map((e) => ({
      id: e.id,
      name: e.name,
      type: 'spot',
      year_established: e.year_established,
      country: e.country,
      url: e.url,
      image: e.image,
      trust_score: e.trust_score,
      trust_score_rank: e.trust_score_rank,
      trade_volume_24h_btc: e.trade_volume_24h_btc,
      trade_volume_24h_btc_normalized: e.trade_volume_24h_btc_normalized,
      open_interest_btc: null,
      number_of_perpetual_pairs: null,
      number_of_futures_pairs: null,
      fsa_warning: FSA_WARNINGS.has(e.id.toLowerCase()),
      asia_regional: ASIA_REGIONAL.has(e.id.toLowerCase()),
      affiliate_code: e.id, // mapped manually in affiliate_links table
    })),
    ...derivatives.map((e) => ({
      id: `${e.id}-derivs`,
      name: e.name,
      type: 'derivatives',
      year_established: e.year_established,
      country: e.country,
      url: e.url,
      image: e.image,
      trust_score: null,
      trust_score_rank: null,
      trade_volume_24h_btc: Number(e.trade_volume_24h_btc),
      trade_volume_24h_btc_normalized: Number(e.trade_volume_24h_btc),
      open_interest_btc: e.open_interest_btc,
      number_of_perpetual_pairs: e.number_of_perpetual_pairs,
      number_of_futures_pairs: e.number_of_futures_pairs,
      fsa_warning: FSA_WARNINGS.has(e.id.toLowerCase()),
      asia_regional: ASIA_REGIONAL.has(e.id.toLowerCase()),
      affiliate_code: e.id,
    })),
  ];
  const { error } = await supabase.from('exchanges_index').upsert(rows, { onConflict: 'id' });
  return done(rows.length, error ? [error.message] : undefined);
}

// ============================================================================
// 11. DEX rankings (DefiLlama dexs overview)
// ============================================================================
export async function ingestDexRankings(): Promise<IngestSummary> {
  const done = start('dex_rankings');
  const supabase = createServiceSupabase();
  const { protocols = [] } = await getDexOverview().catch(() => ({ protocols: [] }));
  const rows = protocols.slice(0, 200).map((d) => ({
    slug: d.slug,
    name: d.name,
    logo: d.logo,
    category: d.category,
    chains: d.chains,
    total_24h_usd: d.total24h,
    total_7d_usd: d.total7d,
    total_30d_usd: d.total30d,
    total_all_time_usd: d.totalAllTime,
    change_1d: d.change_1d,
    change_7d: d.change_7d,
  }));
  const { error } = await supabase.from('dex_rankings').upsert(rows, { onConflict: 'slug' });
  return done(rows.length, error ? [error.message] : undefined);
}
