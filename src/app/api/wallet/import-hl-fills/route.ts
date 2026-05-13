/**
 * Import Hyperliquid fills for the current user's connected wallet.
 *
 * POST /api/wallet/import-hl-fills { address: "0x..." }
 *   → fetches getUserFills(address) from Hyperliquid
 *   → upserts into Supabase `trades` table with source='hyperliquid'
 *   → returns { imported, pnl_30d, fees_paid, builder_fees_estimated }
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFills } from '@/lib/api/hyperliquid';
import { createAuthSupabase } from '@/lib/auth/supabase-server';

const Body = z.object({ address: z.string().regex(/^0x[a-fA-F0-9]{40}$/) });

export async function POST(req: Request) {
  const supabase = await createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_address' }, { status: 400 });

  let fills;
  try {
    fills = await getUserFills(parsed.data.address);
  } catch (e) {
    console.error('[hl-fills] fetch failed', e);
    return NextResponse.json({ error: 'hyperliquid_fetch_failed' }, { status: 502 });
  }

  if (!fills.length) {
    return NextResponse.json({ imported: 0, pnl_30d: 0, fees_paid: 0, builder_fees_estimated: 0 });
  }

  const rows = fills.map((f) => {
    const amount = Number(f.sz);
    const price = Number(f.px);
    const fee = Number(f.fee);
    const closedPnl = Number(f.closedPnl);
    return {
      user_id: user.id,
      coin_id: f.coin.toLowerCase(),
      type: f.side === 'B' ? 'buy' : 'sell',
      amount,
      price_usd: price,
      value_usd: amount * price,
      fee_usd: fee,
      pnl_usd: closedPnl,
      source: 'hyperliquid',
      external_id: String(f.tid),
      executed_at: new Date(f.time).toISOString(),
    };
  });

  // Upsert by (user_id, source, external_id) to keep imports idempotent.
  const { error, count } = await supabase
    .from('trades')
    .upsert(rows, { onConflict: 'user_id,source,external_id', count: 'exact' });
  if (error) {
    console.error('[hl-fills] upsert failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const cutoff30d = now - 30 * 86_400_000;
  const recent = fills.filter((f) => f.time >= cutoff30d);
  const pnl30d = recent.reduce((s, f) => s + Number(f.closedPnl), 0);
  const feesPaid = fills.reduce((s, f) => s + Number(f.fee), 0);
  // Builder Fee = 0.05% of value if Cointier was set as builder. Estimate optimistically.
  const builderFeesEstimated = fills.reduce((s, f) => s + Number(f.sz) * Number(f.px) * 0.0005, 0);

  return NextResponse.json({
    imported: count ?? rows.length,
    pnl_30d: pnl30d,
    fees_paid: feesPaid,
    builder_fees_estimated: builderFeesEstimated,
  });
}
