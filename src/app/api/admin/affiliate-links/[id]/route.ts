import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/db/supabase';
import { isAdminEmail } from '@/lib/auth/admin';
import { createAuthSupabase } from '@/lib/auth/supabase-server';

async function checkAdmin() {
  const supabase = await createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email ?? null)) return null;
  return user;
}

/** PATCH /api/admin/affiliate-links/[id] */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await params;
  try {
    const body = await req.json();
    const supabase = createServiceSupabase();
    const { error } = await supabase
      .from('affiliate_links')
      .update({
        ...(body.code != null && { code: body.code }),
        ...(body.partner_id != null && { partner_id: body.partner_id }),
        ...(body.target_url != null && { target_url: body.target_url }),
        ...(body.campaign !== undefined && { campaign: body.campaign }),
        ...(body.display_name !== undefined && { display_name: body.display_name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.expected_payout_usd !== undefined && { expected_payout_usd: body.expected_payout_usd }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 400 });
  }
}

/** DELETE /api/admin/affiliate-links/[id] — soft delete (is_active = false) */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await params;
  const supabase = createServiceSupabase();
  await supabase.from('affiliate_links').update({ is_active: false }).eq('id', id);
  return NextResponse.json({ ok: true });
}
