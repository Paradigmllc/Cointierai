/**
 * DeFiLlama ingestion library — extracted from scripts/ingest-defillama.ts so the
 * same logic can be triggered via `/api/cron/ingest/defillama` (Coolify cron) and
 * `npm run ingest:defillama` (manual CLI).
 *
 * Three pipelines:
 *   - ingestProtocolTvl:  protocols → coins.defillama_*
 *   - ingestRaises:       raises → vc_funds + funding_rounds + coins.funding_*
 *   - ingestHacks:        hacks → hacks table + coins.hack_*
 *
 * Each pipeline is safely re-runnable (upsert / aggregate semantics) and
 * returns a structured summary so callers can log per-source counts.
 */
import { getProtocols, getRaises, getHacks } from '@/lib/api/defillama';
import { createServiceSupabase } from '@/lib/db/supabase';
import { bulkResolveSymbols, resolveCoin } from '@/lib/db/coin-resolver';

export interface IngestSummary {
  source: string;
  ok: boolean;
  ms: number;
  stats: Record<string, number>;
  errors?: string[];
}

export async function ingestProtocolTvl(): Promise<IngestSummary> {
  const t0 = Date.now();
  const errors: string[] = [];
  const supabase = createServiceSupabase();
  const protocols = await getProtocols();

  const symbolToId = await bulkResolveSymbols(
    supabase,
    protocols.map((p) => p.symbol ?? '').filter(Boolean),
  );

  let matched = 0;
  let updated = 0;
  for (const p of protocols) {
    if (!p.symbol) continue;
    const coinId = symbolToId.get(p.symbol.toLowerCase());
    if (!coinId) continue;
    matched++;

    const { error } = await supabase
      .from('coins')
      .update({
        defillama_slug: p.id,
        defillama_tvl_usd: p.tvl,
        defillama_tvl_change_1d: p.change_1d,
        defillama_tvl_change_7d: p.change_7d,
        defillama_category: p.category,
        defillama_chains: p.chains,
        last_ingest_defillama: new Date().toISOString(),
      })
      .eq('id', coinId);
    if (!error) updated++;
    else errors.push(`tvl:${coinId}:${error.message}`);
  }

  return {
    source: 'defillama:tvl',
    ok: errors.length === 0,
    ms: Date.now() - t0,
    stats: { total_protocols: protocols.length, matched, updated },
    ...(errors.length > 0 ? { errors: errors.slice(0, 10) } : {}),
  };
}

export async function ingestRaises(): Promise<IngestSummary> {
  const t0 = Date.now();
  const errors: string[] = [];
  const supabase = createServiceSupabase();
  const { raises } = await getRaises();

  // 1. VC funds upsert
  const investorMap = new Map<string, { name: string; deals: number; totalUsd: number }>();
  for (const r of raises) {
    for (const investor of [...r.leadInvestors, ...r.otherInvestors]) {
      if (!investor) continue;
      const e = investorMap.get(investor) ?? { name: investor, deals: 0, totalUsd: 0 };
      e.deals += 1;
      e.totalUsd += r.amount ?? 0;
      investorMap.set(investor, e);
    }
  }
  const vcFundRows = [...investorMap.values()].map((v) => ({
    slug: v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: v.name,
    portfolio_count: v.deals,
    total_invested_usd: v.totalUsd > 0 ? v.totalUsd : null,
    source: 'defillama',
  }));
  const { error: vcErr } = await supabase.from('vc_funds').upsert(vcFundRows, { onConflict: 'slug' });
  if (vcErr) errors.push(`vc_funds:${vcErr.message}`);

  // 2. funding_rounds + per-coin aggregates
  const coinAggregates = new Map<
    string,
    { total: number; count: number; latestDate: string | null; latestRound: string | null; latestValuation: number | null }
  >();
  let roundsInserted = 0;
  for (const r of raises) {
    const coin = await resolveCoin(supabase, { name: r.name });
    if (!coin) continue;

    const dateStr = new Date(r.date * 1000).toISOString().slice(0, 10);
    const { error: rndErr } = await supabase.from('funding_rounds').insert({
      coin_id: coin.id,
      round_type: r.round,
      amount_usd: r.amount,
      valuation_usd: r.valuation,
      date: dateStr,
      source: 'defillama',
      source_url: r.source,
    });
    if (!rndErr) roundsInserted++;

    const agg = coinAggregates.get(coin.id) ?? {
      total: 0,
      count: 0,
      latestDate: null,
      latestRound: null,
      latestValuation: null,
    };
    agg.total += r.amount ?? 0;
    agg.count += 1;
    if (!agg.latestDate || dateStr > agg.latestDate) {
      agg.latestDate = dateStr;
      agg.latestRound = r.round;
      agg.latestValuation = r.valuation;
    }
    coinAggregates.set(coin.id, agg);
  }

  let aggUpdated = 0;
  for (const [coinId, agg] of coinAggregates) {
    const { error } = await supabase
      .from('coins')
      .update({
        funding_total_usd: agg.total,
        funding_round_count: agg.count,
        funding_latest_round: agg.latestRound,
        funding_latest_date: agg.latestDate,
        funding_latest_valuation_usd: agg.latestValuation,
      })
      .eq('id', coinId);
    if (!error) aggUpdated++;
  }

  return {
    source: 'defillama:raises',
    ok: errors.length === 0,
    ms: Date.now() - t0,
    stats: {
      total_raises: raises.length,
      vc_funds_upserted: vcFundRows.length,
      rounds_inserted: roundsInserted,
      coins_aggregated: aggUpdated,
    },
    ...(errors.length > 0 ? { errors: errors.slice(0, 10) } : {}),
  };
}

export async function ingestHacks(opts: { limit?: number } = {}): Promise<IngestSummary> {
  const t0 = Date.now();
  const limit = opts.limit ?? 2000;
  const errors: string[] = [];
  const supabase = createServiceSupabase();
  const hacks = await getHacks();

  const coinHackCounts = new Map<string, { count: number; totalLost: number }>();
  let inserted = 0;
  for (const h of hacks.slice(0, limit)) {
    const coin = await resolveCoin(supabase, { name: h.name });
    if (coin) {
      const agg = coinHackCounts.get(coin.id) ?? { count: 0, totalLost: 0 };
      agg.count += 1;
      agg.totalLost += h.amount ?? 0;
      coinHackCounts.set(coin.id, agg);
    }

    const { error } = await supabase.from('hacks').insert({
      coin_id: coin?.id ?? null,
      protocol_name: h.name,
      date: new Date(h.date * 1000).toISOString().slice(0, 10),
      amount_lost_usd: h.amount,
      root_cause: h.classification,
      source_urls: h.source ? [h.source] : [],
    });
    if (!error) inserted++;
  }

  let aggUpdated = 0;
  for (const [coinId, agg] of coinHackCounts) {
    const { error } = await supabase
      .from('coins')
      .update({ hack_count: agg.count, hack_total_lost_usd: agg.totalLost })
      .eq('id', coinId);
    if (!error) aggUpdated++;
  }

  return {
    source: 'defillama:hacks',
    ok: errors.length === 0,
    ms: Date.now() - t0,
    stats: { total_hacks: hacks.length, inserted, coins_aggregated: aggUpdated },
  };
}

export async function ingestAllDeFiLlama(): Promise<IngestSummary[]> {
  const tvl = await ingestProtocolTvl().catch((e) => errorSummary('defillama:tvl', e));
  const raises = await ingestRaises().catch((e) => errorSummary('defillama:raises', e));
  const hacks = await ingestHacks().catch((e) => errorSummary('defillama:hacks', e));
  return [tvl, raises, hacks];
}

function errorSummary(source: string, e: unknown): IngestSummary {
  return {
    source,
    ok: false,
    ms: 0,
    stats: {},
    errors: [e instanceof Error ? e.message : String(e)],
  };
}
