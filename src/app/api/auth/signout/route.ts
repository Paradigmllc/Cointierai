import { NextResponse } from 'next/server';
import { createAuthSupabase } from '@/lib/auth/supabase-server';

export async function POST() {
  try {
    const supabase = await createAuthSupabase();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'signout failed' }, { status: 500 });
  }
}
