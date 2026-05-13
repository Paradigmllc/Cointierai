import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const COINTIER_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'cointier';

const PROTECTED_PATHS = ['/dashboard', '/pclaim'];

/**
 * Combined i18n + Supabase Auth middleware
 *
 * - Cookie refresh for session persistence (Supabase Auth standard)
 * - Protect /dashboard, /pclaim routes (redirect to /auth/login if no session)
 */
export async function middleware(request: NextRequest) {
  // 1. i18n routing
  const response = intlMiddleware(request);

  // 2. Supabase session refresh (only if env configured)
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return response;
  }

  // Use the redirected/processed response (from next-intl) and propagate cookies
  let supabaseResponse = response ?? NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
    db: { schema: COINTIER_SCHEMA },
  });

  // 3. Refresh session (call getUser to refresh tokens)
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  // 4. Protected route check
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const localePart = segments[0] ?? '';
  const restPath = '/' + segments.slice(1).join('/');
  const isProtected = PROTECTED_PATHS.some((p) => restPath.startsWith(p));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localePart}/auth/login`;
    url.searchParams.set('redirect', restPath);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
