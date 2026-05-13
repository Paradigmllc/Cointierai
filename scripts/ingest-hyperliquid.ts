/**
 * scripts/ingest-hyperliquid.ts
 *
 * Hyperliquid Perps を coins.hl_* に materialize
 * - hl_listed = Hyperliquid 上場有無 (Builder Fee 対象判定)
 * - hl_funding_rate / hl_open_interest_usd / hl_volume_24h_usd
 *
 * 完全無料 API・100 req/分
 */

import 'dotenv/config';
import { getMetaAndCtxs } from '../src/lib/api/hyperliquid';
import { createServiceSupabase } from '../src/lib/db/supabase';
import { resolveBySymbol } from '../src/lib/db/coin-resolver';

async function main() {
  const supabase = createServiceSupabase();
  const [meta, ctxs] = await getMetaAndCtxs();
  console.log(`[ingest:hl] perps universe: ${meta.universe.length}`);

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
  console.log(`[ingest:hl] matched ${matched} · updated ${updated}`);
}

main().catch((err) => {
  console.error('[ingest:hl] fatal', err);
  process.exit(1);
});
