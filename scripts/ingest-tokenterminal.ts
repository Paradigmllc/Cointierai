/**
 * scripts/ingest-tokenterminal.ts
 *
 * Token Terminal (月 50 万 req 無料) — クリプト版 P/E・P/S を coins テーブルへ集約
 *
 * 302 プロジェクト対応 → BTC/ETH 等の主要銘柄に tt_pe_ratio / tt_revenue_30d_usd 等を materialize
 */

import 'dotenv/config';
import { getProjects } from '../src/lib/api/tokenterminal';
import { createServiceSupabase } from '../src/lib/db/supabase';
import { resolveBySymbol } from '../src/lib/db/coin-resolver';

async function main() {
  if (!process.env.TOKEN_TERMINAL_API_KEY) {
    console.warn('[ingest:tt] TOKEN_TERMINAL_API_KEY not set, skipping');
    return;
  }
  const supabase = createServiceSupabase();
  const { data: projects } = await getProjects();
  console.log(`[ingest:tt] projects: ${projects?.length ?? 0}`);

  let matched = 0;
  let updated = 0;
  for (const p of projects ?? []) {
    if (!p.symbol) continue;
    const coin = await resolveBySymbol(supabase, p.symbol);
    if (!coin) continue;
    matched++;

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
        // P/E = mcap / earnings (annualized revenue を proxy)
        tt_pe_ratio:
          p.revenue_annualized && p.market_cap && p.revenue_annualized > 0
            ? p.market_cap / p.revenue_annualized
            : null,
        last_ingest_tokenterminal: new Date().toISOString(),
      })
      .eq('id', coin.id);
    if (!error) updated++;
  }
  console.log(`[ingest:tt] matched ${matched} · updated ${updated}`);
}

main().catch((err) => {
  console.error('[ingest:tt] fatal', err);
  process.exit(1);
});
