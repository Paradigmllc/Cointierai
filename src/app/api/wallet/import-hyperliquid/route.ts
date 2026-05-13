import { NextRequest, NextResponse } from 'next/server';
import { createAuthSupabase } from '@/lib/auth/supabase-server';
import { getUserFills } from '@/lib/wallet/hyperliquid-client';

/**
 * POST /api/wallet/import-hyperliquid
 *
 * Body: { walletAddress: string; daysBack?: number }
 *
 * - ユーザーの Hyperliquid 取引履歴を取得
 * - trades テーブルに upsert (税務計算 / ポートフォリオ分析の base)
 * - Hyperliquid Perps: BUY/SELL × close P&L 含めて記録
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAuthSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const body = (await req.json()) as { walletAddress: string; daysBack?: number };
    if (!body.walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(body.walletAddress)) {
      return NextResponse.json({ error: 'invalid address' }, { status: 400 });
    }
    const daysBack = Math.min(Math.max(body.daysBack ?? 90, 1), 365);
    const fills = await getUserFills(body.walletAddress, Date.now() - daysBack * 86_400_000);

    // trades テーブルに upsert
    const rows = fills.map((f) => ({
      user_id: user.id,
      coin_id: f.coin.toLowerCase(),
      trade_type: f.side === 'B' ? 'buy' as const : 'sell' as const,
      amount: parseFloat(f.sz),
      price_usd: parseFloat(f.px),
      fee_usd: parseFloat(f.fee),
      source: 'hyperliquid',
      source_tx_hash: f.hash,
      executed_at: new Date(f.time).toISOString(),
    }));

    let inserted = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase.from('trades').insert(chunk);
      if (error && !error.message.includes('duplicate')) {
        console.warn('[import-hyperliquid] insert err', error.message);
      } else {
        inserted += chunk.length;
      }
    }

    return NextResponse.json({ ok: true, imported: inserted, totalFills: fills.length });
  } catch (e) {
    console.error('[import-hyperliquid] err', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
