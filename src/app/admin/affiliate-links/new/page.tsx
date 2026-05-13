import { AffiliateLinkForm } from '@/components/admin/AffiliateLinkForm';
import { createServiceSupabase } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export default async function NewAffiliateLink() {
  const supabase = createServiceSupabase();
  const { data: partners } = await supabase
    .from('affiliate_partners')
    .select('id, name, default_payout_usd')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">New Affiliate Link</h1>
        <p className="text-xs text-muted-foreground mt-1">
          /go/[code] でアクセス可能な短縮リンクを作成
        </p>
      </header>

      <AffiliateLinkForm partners={partners ?? []} />
    </div>
  );
}
