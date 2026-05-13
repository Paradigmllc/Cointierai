import { NextRequest, NextResponse } from 'next/server';
import { createAuthSupabase } from '@/lib/auth/supabase-server';

/**
 * OAuth + Magic Link callback handler
 *
 * Supabase Auth flow:
 *   1. ユーザーが Google ボタン / Magic Link をクリック
 *   2. Supabase Auth が /auth/callback?code=XXX&next=YYY にリダイレクト
 *   3. このハンドラが code → session に交換
 *   4. profile を upsert (初回登録時)
 *   5. next URL にリダイレクト
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';
  const localeSegment = url.pathname.split('/')[1] ?? 'ja';

  if (code) {
    try {
      const supabase = await createAuthSupabase();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[auth callback] exchange err', error);
        return NextResponse.redirect(new URL(`/${localeSegment}/auth/login?error=callback`, request.url));
      }

      // Initialize profile (idempotent upsert)
      if (data?.user) {
        const { id, email, user_metadata } = data.user;
        await supabase.from('profiles').upsert(
          {
            id,
            email,
            display_name: user_metadata?.name ?? user_metadata?.full_name ?? null,
            preferred_locale: user_metadata?.preferred_locale ?? localeSegment,
          },
          { onConflict: 'id' },
        );
      }
    } catch (e) {
      console.error('[auth callback] err', e);
      return NextResponse.redirect(new URL(`/${localeSegment}/auth/login?error=callback`, request.url));
    }
  }

  // Redirect to "next" path (within same locale)
  const target = next.startsWith('/') ? `/${localeSegment}${next}` : next;
  return NextResponse.redirect(new URL(target, request.url));
}
