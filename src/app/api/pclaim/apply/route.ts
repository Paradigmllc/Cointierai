import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/db/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      project_or_vc_name: string;
      type: 'project' | 'vc';
      coin_slug?: string;
      contact_email: string;
      contact_name: string;
      plan: 'free' | 'pro';
      company_website: string;
      note?: string;
    };
    const supabase = createServiceSupabase();
    let coinId: string | null = null;
    let vcFundId: string | null = null;
    if (body.type === 'project' && body.coin_slug) {
      const { data: coin } = await supabase.from('coins').select('id').eq('id', body.coin_slug).maybeSingle();
      coinId = coin?.id ?? null;
    }
    if (body.type === 'vc') {
      const slug = body.project_or_vc_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const { data: vc } = await supabase.from('vc_funds').upsert({ slug, name: body.project_or_vc_name, website: body.company_website, source: 'pclaim' }, { onConflict: 'slug' }).select('id').maybeSingle();
      vcFundId = vc?.id ?? null;
    }
    await supabase.from('pclaim_listings').insert({
      coin_id: coinId,
      vc_fund_id: vcFundId,
      plan: body.plan,
      is_verified: false,
    });
    // (M6 で email 通知 via Resend を追加)
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[pclaim:apply] err', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
