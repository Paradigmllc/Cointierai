/**
 * Attribution Tracking — Cookie + S2S + Supabase 永久ロックイン (S2S トリニティ)
 *
 * Paradigm 既存ノウハウ:
 *   - S2S (95%精度) — server-to-server postback
 *   - imgタグ (補助) — 1px img beacon for client-side first touch
 *   - セッション永続化 (100%) — Cookie + Supabase 永久保存・Cookie 廃止後も追跡
 *
 * 設計:
 *   1. 全ページで _ctr_sess Cookie (1st party, max-age 10 年, HttpOnly) を発行
 *   2. /go/[code] アクセス時に click_id を生成・affiliate_clicks に保存
 *      → パートナー URL に click_id をクエリ付与してリダイレクト
 *   3. パートナーが S2S postback (HMAC 署名) → /api/affiliate/postback で受信
 *      → click_id をキーに converted_at + revenue を記録
 *   4. ユーザーがログインしたら session_id ↔ user_id をリンク
 *      → 10 年スパンの "wallet ↔ user ↔ session" 永久追跡
 */

import { createHash, randomBytes, createHmac } from 'node:crypto';
import { createServiceSupabase } from '@/lib/db/supabase';
import type { NextRequest } from 'next/server';

export const ATTRIBUTION_COOKIE = '_ctr_sess';
export const COOKIE_MAX_AGE_SECONDS = 10 * 365 * 24 * 60 * 60; // 10 年

// 日次回転 salt — IP/UA を hash 化する際の rotation key
function dailySalt(): string {
  const day = Math.floor(Date.now() / 86_400_000);
  return `${day}.${process.env.ATTRIBUTION_SALT ?? 'cointier-default-salt'}`;
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(ip + dailySalt()).digest('hex').slice(0, 32);
}

export function hashUa(ua: string | null): string | null {
  if (!ua) return null;
  return createHash('sha256').update(ua).digest('hex').slice(0, 16);
}

export function newSessionCookie(): string {
  // 32 byte URL-safe base64 (Cookie value · 約 43 chars)
  return randomBytes(32).toString('base64url');
}

export function newClickId(): string {
  // 16 byte hex (パートナー URL に乗せても十分・collision なし)
  return randomBytes(16).toString('hex');
}

/**
 * Request から訪問者属性を抽出
 */
export interface VisitorContext {
  ip: string | null;
  ua: string | null;
  referer: string | null;
  countryCode: string | null;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  utm: { source: string | null; medium: string | null; campaign: string | null };
}

export function extractVisitor(req: NextRequest): VisitorContext {
  const headers = req.headers;
  // X-Forwarded-For 先頭が真の IP
  const xff = headers.get('x-forwarded-for')?.split(',')[0].trim();
  const ip = xff || headers.get('x-real-ip') || null;
  const ua = headers.get('user-agent');
  const referer = headers.get('referer') || null;
  const countryCode = headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || null;
  const url = new URL(req.url);
  const utmSource = url.searchParams.get('utm_source');
  const utmMedium = url.searchParams.get('utm_medium');
  const utmCampaign = url.searchParams.get('utm_campaign');

  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (ua) {
    if (/(tablet|ipad)/i.test(ua)) deviceType = 'tablet';
    else if (/(mobile|iphone|android)/i.test(ua)) deviceType = 'mobile';
  }

  return { ip, ua, referer, countryCode, deviceType, utm: { source: utmSource, medium: utmMedium, campaign: utmCampaign } };
}

/**
 * Session を upsert (cookie value で identify)
 *  - 存在しない場合 INSERT
 *  - 存在する場合は last_seen_at + pageviews++
 */
export async function upsertSession(
  cookieValue: string,
  visitor: VisitorContext,
  options: { landingLocale?: string; landingPath?: string; userId?: string } = {},
): Promise<string | null> {
  const supabase = createServiceSupabase();
  try {
    // Try update first
    const { data: existing } = await supabase
      .from('attribution_sessions')
      .select('id, pageviews')
      .eq('session_cookie', cookieValue)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('attribution_sessions')
        .update({
          last_seen_at: new Date().toISOString(),
          pageviews: (existing.pageviews ?? 0) + 1,
          ...(options.userId ? { user_id: options.userId } : {}),
        })
        .eq('id', existing.id);
      return existing.id as string;
    }

    // Insert new
    const { data: inserted, error } = await supabase
      .from('attribution_sessions')
      .insert({
        session_cookie: cookieValue,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        user_id: options.userId ?? null,
        ip_hash: hashIp(visitor.ip),
        ua_hash: hashUa(visitor.ua),
        initial_referer: visitor.referer,
        initial_utm_source: visitor.utm.source,
        initial_utm_medium: visitor.utm.medium,
        initial_utm_campaign: visitor.utm.campaign,
        country_code: visitor.countryCode,
        device_type: visitor.deviceType,
        landing_locale: options.landingLocale ?? null,
        landing_path: options.landingPath ?? null,
        pageviews: 1,
      })
      .select('id')
      .single();
    if (error) {
      console.warn('[attribution] session insert err', error.message);
      return null;
    }
    return inserted.id;
  } catch (e) {
    console.error('[attribution] upsertSession err', e);
    return null;
  }
}

/**
 * S2S postback HMAC 検証
 *
 * パートナーから到着した postback を partner.s2s_secret で HMAC-SHA256 検証
 */
export function verifyS2sSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * パートナー URL に click_id を埋め込んで返す
 *  - 主要パートナーごとに違うクエリ key を使う (BingX: invite_code, MEXC: ref, Hyperliquid: ref)
 */
export function buildAffiliateUrl(targetUrl: string, partnerId: string, clickId: string): string {
  const url = new URL(targetUrl);
  // パートナー別の subID パラメータ名
  const subIdParam: Record<string, string> = {
    bingx: 'subid',
    mexc: 'sub',
    bitget: 'aff_sub',
    kucoin: 'utm_term',
    coinbase: 'sid',
    kraken: 'sid',
    hashkey: 'ref_sub',
    'coins-ph': 'subid',
    coindcx: 'sub',
    bitkub: 'subid',
    indodax: 'subid',
    hyperliquid: 'ref',
    polymarket: 'via',
    ledger: 'utm_term',
    trezor: 'utm_term',
  };
  const param = subIdParam[partnerId] ?? 'subid';
  // 既存パラメータがあれば上書きしない (パートナー固有の affiliate code 等は残す)
  if (!url.searchParams.has(param)) {
    url.searchParams.set(param, clickId);
  }
  // 必ず click_id クエリも付与 (universal な fallback)
  url.searchParams.set('cointier_click_id', clickId);
  return url.toString();
}
