import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/db/supabase';
import { verifyS2sSignature } from '@/lib/attribution/tracking';

/**
 * POST /api/affiliate/postback/[partner]
 *
 * S2S postback receiver — パートナーが「ユーザーがコンバージョン」を通知してくるエンドポイント
 *
 * パートナー側設定: postback URL を以下に設定
 *   https://cointier.ai/api/affiliate/postback/bingx?click_id={SUBID}&value={AMOUNT}&signature={HMAC}
 *
 * Body: パートナーごとに様々. 共通フィールド:
 *   - click_id (cointier 側 click_id)
 *   - event_type (signup / first_deposit / first_trade / subscription)
 *   - value_usd (取引高 / 預入額)
 *   - payout_usd (Cointier 受取額)
 *   - external_tx_id (パートナー側 ID)
 *
 * 検証:
 *   - HMAC-SHA256 (affiliate_partners.s2s_secret で署名)
 *   - パートナーごとに署名フォーマット異なる
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ partner: string }> }) {
  const { partner } = await params;
  const url = new URL(req.url);

  try {
    const rawBody = await req.text();
    const supabase = createServiceSupabase();

    // 1. パートナー設定取得
    const { data: partnerCfg } = await supabase
      .from('affiliate_partners')
      .select('id, s2s_secret, s2s_signature_format, is_active')
      .eq('id', partner)
      .maybeSingle();
    if (!partnerCfg || !partnerCfg.is_active) {
      return NextResponse.json({ error: 'partner not configured' }, { status: 404 });
    }

    // 2. HMAC 検証 (header / query / body location is partner-dependent)
    const signature =
      req.headers.get('x-signature') ??
      req.headers.get('x-hmac-signature') ??
      url.searchParams.get('signature') ??
      url.searchParams.get('sig');
    let validated = false;
    if (partnerCfg.s2s_secret) {
      validated = verifyS2sSignature(rawBody || url.search, signature ?? '', partnerCfg.s2s_secret);
    }

    // 3. Payload 解析 (JSON or query)
    let payload: Record<string, unknown> = {};
    if (rawBody) {
      try { payload = JSON.parse(rawBody); } catch { /* fallback to query below */ }
    }
    if (Object.keys(payload).length === 0) {
      payload = Object.fromEntries(url.searchParams.entries());
    }

    const clickId = String(payload.click_id ?? payload.subid ?? payload.sub ?? '');
    if (!clickId) {
      return NextResponse.json({ error: 'click_id required' }, { status: 400 });
    }

    // 4. Click 検索
    const { data: click } = await supabase
      .from('affiliate_clicks')
      .select('id, affiliate_link_id, converted_at')
      .eq('click_id', clickId)
      .maybeSingle();
    if (!click) {
      // 既知でない click_id — それでも raw を記録 (audit)
      await supabase.from('affiliate_conversions').insert({
        click_id: clickId,
        partner_id: partner,
        event_type: String(payload.event_type ?? 'unknown'),
        value_usd: parseFloat(String(payload.value_usd ?? payload.amount ?? '0')) || null,
        payout_usd: parseFloat(String(payload.payout_usd ?? payload.commission ?? '0')) || null,
        external_tx_id: payload.tx_id ? String(payload.tx_id) : null,
        raw_payload: payload,
        validated,
      });
      return NextResponse.json({ ok: true, click_found: false, validated });
    }

    // 5. Conversion 記録
    const valueUsd = parseFloat(String(payload.value_usd ?? payload.amount ?? '0')) || null;
    const payoutUsd = parseFloat(String(payload.payout_usd ?? payload.commission ?? '0')) || null;
    const eventType = String(payload.event_type ?? 'conversion');

    await supabase.from('affiliate_conversions').insert({
      click_id: clickId,
      partner_id: partner,
      event_type: eventType,
      value_usd: valueUsd,
      payout_usd: payoutUsd,
      external_tx_id: payload.tx_id ? String(payload.tx_id) : null,
      raw_payload: payload,
      validated,
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    });

    // 6. Click 行を更新 (converted_at + value)
    if (!click.converted_at) {
      await supabase
        .from('affiliate_clicks')
        .update({
          converted_at: new Date().toISOString(),
          conversion_value_usd: payoutUsd ?? valueUsd,
          conversion_metadata: { event_type: eventType, validated },
        })
        .eq('id', click.id);
    }

    return NextResponse.json({ ok: true, click_found: true, validated });
  } catch (e) {
    console.error('[postback]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}

// GET 形式の postback もある (一部パートナー)
export const GET = POST;
