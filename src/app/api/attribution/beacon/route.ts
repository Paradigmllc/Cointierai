import { NextRequest, NextResponse } from 'next/server';
import {
  ATTRIBUTION_COOKIE,
  COOKIE_MAX_AGE_SECONDS,
  extractVisitor,
  newSessionCookie,
  upsertSession,
} from '@/lib/attribution/tracking';

/**
 * GET /api/attribution/beacon
 *
 * S2S トリニティ「imgタグ補助」レイヤー — 1x1 PNG beacon
 *
 * 使い方:
 *   <img src="/api/attribution/beacon?page=/coin/bitcoin" width="1" height="1" alt="" />
 *
 * 効果:
 *   - JS 無効環境でも session cookie が発行される
 *   - メール HTML 内に埋めればメール開封追跡も可能
 *   - Web/Mobile/Email を横断する universal tracking pixel
 */
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  let sessionCookie = req.cookies.get(ATTRIBUTION_COOKIE)?.value;
  if (!sessionCookie || sessionCookie.length < 30) {
    sessionCookie = newSessionCookie();
  }
  const visitor = extractVisitor(req);

  // Best-effort session upsert (failures don't block the pixel response)
  void upsertSession(sessionCookie, visitor, {
    landingPath: url.searchParams.get('page') ?? undefined,
    landingLocale: url.searchParams.get('locale') ?? undefined,
  });

  const response = new NextResponse(TRANSPARENT_PNG, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, max-age=0',
      'Content-Length': String(TRANSPARENT_PNG.length),
    },
  });
  response.cookies.set(ATTRIBUTION_COOKIE, sessionCookie, {
    maxAge: COOKIE_MAX_AGE_SECONDS,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
