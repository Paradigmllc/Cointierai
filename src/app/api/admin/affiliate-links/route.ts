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

/** GET /api/admin/affiliate-links */
export async function GET() {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = createServiceSupabase();
  const { data } = await supabase.from('affiliate_links').select('*').order('created_at', { ascending: false });
  return NextResponse.json({ data });
}

/** POST /api/admin/affiliate-links */
export async function POST(req: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from('affiliate_links')
      .insert({
        code: body.code,
        partner_id: body.partner_id,
        target_url: body.target_url,
        campaign: body.campaign || null,
        display_name: body.display_name || null,
        description: body.description || null,
        expected_payout_usd: body.expected_payout_usd || null,
        is_active: body.is_active ?? true,
        created_by: user.id,
      })
      .select('id')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
