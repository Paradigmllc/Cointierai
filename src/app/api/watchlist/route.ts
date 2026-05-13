/**
 * Watchlist CRUD — Supabase + RLS-protected.
 * GET    /api/watchlist        → list current user's watchlist
 * POST   /api/watchlist {coin} → upsert
 * DELETE /api/watchlist {coin} → remove
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthSupabase } from '@/lib/auth/supabase-server';

const Body = z.object({ coin_id: z.string().min(1).max(100) });

async function requireUser() {
  const supabase = await createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ items: [] }, { status: 401 });
  const { data, error } = await auth.supabase
    .from('watchlists')
    .select('coin_id, added_at')
    .order('added_at', { ascending: false });
  if (error) {
    console.error('[watchlist GET]', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parse = Body.safeParse(await req.json().catch(() => null));
  if (!parse.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const { error } = await auth.supabase
    .from('watchlists')
    .upsert({ user_id: auth.user.id, coin_id: parse.data.coin_id }, { onConflict: 'user_id,coin_id' });
  if (error) {
    console.error('[watchlist POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parse = Body.safeParse(await req.json().catch(() => null));
  if (!parse.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const { error } = await auth.supabase
    .from('watchlists')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('coin_id', parse.data.coin_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
