/**
 * Token Terminal ingestion library — P/E, P/S, revenue, fees → coins.tt_*.
 * Requires TOKEN_TERMINAL_API_KEY; returns "skipped" when missing.
 */
import { getProjects } from '@/lib/api/tokenterminal';
import { createServiceSupabase } from '@/lib/db/supabase';
import { resolveBySymbol } from '@/lib/db/coin-resolver';
import type { IngestSummary } from '@/lib/ingest/defillama';

export async function ingestTokenTerminal(): Promise<IngestSummary> {
  const t0 = Date.now();
  if (!process.env.TOKEN_TERMINAL_API_KEY) {
    return { source: 'token-terminal', ok: true, ms: 0, stats: { skipped: 1 }, errors: ['TOKEN_TERMINAL_API_KEY not set'] };
  }

  const supabase = createServiceSupabase();
  const { data: projects } = await getProjects();

  let matched = 0;
  let updated = 0;
  for (const p of projects ?? []) {
    if (!p.symbol) continue;
    const coin = await resolveBySymbol(supabase, p.symbol);
    if (!coin) continue;
    matched++;
    const peRatio =
      p.revenue_annualized && p.market_cap && p.revenue_annualized > 0
        ? p.market_cap / p.revenue_annualized
        : null;
    const { error } = await supabase
      .from('coins')
      .update({
        tokenterminal_slug: p.slug,
        tt_revenue_30d_usd: p.revenue_30d,
        tt_revenue_annualized_usd: p.revenue_annualized,
        tt_fees_30d_usd: p.fees_30d,
        tt_ps_ratio: p.ps_ratio,
        tt_pf_ratio: p.pf_ratio,
        tt_active_users_30d: p.active_users_30d,
        tt_pe_ratio: peRatio,
        last_ingest_tokenterminal: new Date().toISOString(),
      })
      .eq('id', coin.id);
    if (!error) updated++;
  }

  return {
    source: 'token-terminal',
    ok: true,
    ms: Date.now() - t0,
    stats: { projects: projects?.length ?? 0, matched, updated },
  };
}
