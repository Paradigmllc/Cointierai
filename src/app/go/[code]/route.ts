import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/db/supabase';
import {
  ATTRIBUTION_COOKIE,
  COOKIE_MAX_AGE_SECONDS,
  buildAffiliateUrl,
  extractVisitor,
  hashIp,
  hashUa,
  newClickId,
  newSessionCookie,
  upsertSession,
} from '@/lib/attribution/tracking';

/**
 * /go/[code] — アフィリエイトリンクルーター
 *
 * 流れ (S2S トリニティ):
 *   1. [code] で affiliate_links を解決
 *   2. 永続 session cookie (_ctr_sess) を取得・なければ発行
 *   3. click_id を生成
 *   4. affiliate_clicks へ INSERT (Supabase 永続記録)
 *   5. パートナー URL に click_id を埋め込んでリダイレクト
 *
 * Cookie + DB の両方に記録するので、ユーザー側が Cookie 削除しても DB の click record は残る
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(req.url);

  try {
    const supabase = createServiceSupabase();

    // 1. Affiliate link 解決
    const { data: link } = await supabase
      .from('affiliate_links')
      .select('id, code, partner_id, target_url, is_active, campaign')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (!link) {
      // 該当 link なし → 404 ではなくホームへ穏やかに redirect (UX)
      return NextResponse.redirect(new URL('/?aff_err=not_found', req.url));
    }

    // 2. Session cookie
    let sessionCookie = req.cookies.get(ATTRIBUTION_COOKIE)?.value;
    if (!sessionCookie || sessionCookie.length < 30) {
      sessionCookie = newSessionCookie();
    }
    const visitor = extractVisitor(req);
    const sessionId = await upsertSession(sessionCookie, visitor, {
      landingPath: `/go/${code}`,
    });

    // 3. Click ID 生成
    const clickId = newClickId();

    // 4. affiliate_clicks へ INSERT (DB 永続)
    await supabase.from('affiliate_clicks').insert({
      click_id: clickId,
      affiliate_link_id: link.id,
      session_id: sessionId,
      partner_id: link.partner_id,
      referer: visitor.referer,
      ip_hash: hashIp(visitor.ip),
      ua: visitor.ua,
      ua_hash: hashUa(visitor.ua),
      country_code: visitor.countryCode,
      locale: url.searchParams.get('locale'),
      page_path: visitor.referer ? new URL(visitor.referer, req.url).pathname : null,
      coin_id: url.searchParams.get('coin'),
    });

    // 5. Update session.last_click_id
    if (sessionId) {
      await supabase
        .from('attribution_sessions')
        .update({ last_click_id: clickId })
        .eq('id', sessionId);
    }

    // 6. Redirect to partner URL with click_id
    const destUrl = buildAffiliateUrl(link.target_url, link.partner_id, clickId);
    const response = NextResponse.redirect(destUrl, { status: 302 });

    // 7. Set 永続 cookie (10 年・1st party)
    response.cookies.set(ATTRIBUTION_COOKIE, sessionCookie, {
      maxAge: COOKIE_MAX_AGE_SECONDS,
      httpOnly: false,             // JS からも読める (Plausible 風 attribution に活用)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // 8. img beacon 用に X-Cointier-Click ヘッダーも返す (debug)
    response.headers.set('X-Cointier-Click', clickId);
    return response;
  } catch (e) {
    console.error('[/go/]', e);
    return NextResponse.redirect(new URL('/?aff_err=server', req.url));
  }
}
