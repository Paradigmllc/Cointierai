import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/db/supabase';

/**
 * Builder Fee 承認の DB 記録
 * POST /api/wallet/builder-fee-approval
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      walletAddress: string;
      builderAddress: string;
      maxFeeRate: string;
      signature: string;
      approvedAt: string;
      protocol: string;
    };
    const supabase = createServiceSupabase();

    // wallet 行 upsert (unauth フロー — wagmi だけで使える)
    const { data: wallet } = await supabase
      .from('wallets')
      .upsert(
        {
          address: body.walletAddress.toLowerCase(),
          chain_id: 'arbitrum',
          is_primary: true,
        },
        { onConflict: 'address,chain_id' },
      )
      .select('id')
      .maybeSingle();

    if (!wallet) return NextResponse.json({ error: 'wallet upsert failed' }, { status: 500 });

    const { error } = await supabase.from('builder_fee_approvals').insert({
      wallet_id: wallet.id,
      builder_address: body.builderAddress,
      max_fee_rate: parseFloat(body.maxFeeRate.replace('%', '')) / 100,
      protocol: body.protocol,
      approved_at: body.approvedAt,
    });
    if (error) console.error('[builder-fee-approval] insert err', error);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[builder-fee-approval] err', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
