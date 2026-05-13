import { NextRequest, NextResponse } from 'next/server';
import { createAuthSupabase } from '@/lib/auth/supabase-server';

/**
 * POST /api/wallet/builder-fee/revoke
 *
 * Builder Fee 承認を「解除済」マークする (DB レベル)。
 * オンチェーン上の承認はユーザーが Hyperliquid UI で別途解除する必要がある。
 *
 * (将来: revoke も EIP-712 署名で自動化可能)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAuthSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { walletAddress: string };
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .eq('address', body.walletAddress.toLowerCase())
      .maybeSingle();
    if (!wallet) {
      return NextResponse.json({ error: 'wallet not found' }, { status: 404 });
    }
    await supabase
      .from('builder_fee_approvals')
      .update({ revoked_at: new Date().toISOString() })
      .eq('wallet_id', wallet.id)
      .is('revoked_at', null);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
