import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // 全 path で i18n routing を適用 (api / _next / 静的アセットは除外)
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
