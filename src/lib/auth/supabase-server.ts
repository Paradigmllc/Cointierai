/**
 * Server-side Supabase Auth helpers (production-grade)
 *
 * Notion L1932-1936 + Supabase Auth ベストプラクティス:
 *   - Server Components / Route Handlers / Server Actions で使用
 *   - Cookie-based session 管理 (SSR 対応)
 *   - createServerSupabase() の auth-enabled 版
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const COINTIER_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'cointier';

/**
 * Server-side Auth-aware Supabase client
 * Session cookie を読み取り、現在のユーザー情報を返す
 *
 * 注: `<Database>` generic を意図的に省く. cointier schema が
 * `@supabase/ssr` 型推論を貫通せず `never` に narrow されるため.
 */
export async function createAuthSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment not configured');
  }
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component の場合は no-op (middleware で更新)
        }
      },
    },
    db: { schema: COINTIER_SCHEMA },
  });
}

/**
 * 現在のユーザー (Server Component で使用)
 *  - 未認証なら null
 *  - 認証済なら User + profile
 */
export async function getCurrentUser() {
  const supabase = await createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return { user, profile };
}

/**
 * 認証必須ガード (Server Component / Route Handler 用)
 *  - 未認証なら login へ redirect
 */
export async function requireAuth(redirectTo = '/auth/login') {
  const session = await getCurrentUser();
  if (!session) redirect(redirectTo);
  return session;
}

/**
 * Pro 以上ガード — subscription を確認
 */
export async function requirePro(redirectTo = '/pricing') {
  const session = await requireAuth();
  const supabase = await createAuthSupabase();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .in('plan', ['pro', 'business'])
    .maybeSingle();
  if (!sub) redirect(redirectTo);
  return { ...session, subscription: sub };
}
