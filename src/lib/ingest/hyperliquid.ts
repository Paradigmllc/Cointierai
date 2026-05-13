/**
 * Hyperliquid ingestion library.
 * Mirrors scripts/ingest-hyperliquid.ts so the same flow can be invoked from
 * an API route. Perps metadata + market context → coins.hl_*.
 */
import { getMetaAndCtxs } from '@/lib/api/hyperliquid';
import { createServiceSupabase } from '@/lib/db/supabase';
import { resolveBySymbol } from '@/lib/db/coin-resolver';
import type { IngestSummary } from '@/lib/ingest/defillama';

export async function ingestHyperliquid(): Promise<IngestSummary> {
  const t0 = Date.now();
  const supabase = createServiceSupabase();
  const [meta, ctxs] = await getMetaAndCtxs();

  let matched = 0;
  let updated = 0;
  for (let i = 0; i < meta.universe.length; i++) {
    const asset = meta.universe[i];
    const ctx = ctxs[i];
    if (!asset || !ctx) continue;

    const coin = await resolveBySymbol(supabase, asset.name);
    if (!coin) continue;
    matched++;

    const markPx = parseFloat(ctx.markPx);
    const oi = parseFloat(ctx.openInterest);
    const vol = parseFloat(ctx.dayNtlVlm);
    const funding = parseFloat(ctx.funding);

    const { error } = await supabase
      .from('coins')
      .update({
        hl_listed: true,
        hl_funding_rate: Number.isFinite(funding) ? funding : null,
        hl_open_interest_usd: Number.isFinite(oi) && Number.isFinite(markPx) ? oi * markPx : null,
        hl_volume_24h_usd: Number.isFinite(vol) ? vol : null,
        hl_mark_price: Number.isFinite(markPx) ? markPx : null,
        hl_max_leverage: asset.maxLeverage,
        last_ingest_hyperliquid: new Date().toISOString(),
      })
      .eq('id', coin.id);
    if (!error) updated++;
  }

  return {
    source: 'hyperliquid',
    ok: true,
    ms: Date.now() - t0,
    stats: { universe: meta.universe.length, matched, updated },
  };
}
