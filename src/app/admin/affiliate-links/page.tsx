import { createServiceSupabase } from '@/lib/db/supabase';
import { Plus, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCompact } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

export default async function AffiliateLinksAdmin() {
  const supabase = createServiceSupabase();
  const { data: links } = await supabase
    .from('affiliate_links')
    .select('*')
    .order('click_count', { ascending: false })
    .limit(200);

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Affiliate Links</h1>
          <p className="text-xs text-muted-foreground mt-1">
            /go/[code] でアクセスされる短縮リンク. クリック→S2S postback→DB 永続記録の 3 段で追跡.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/affiliate-links/new"><Plus className="h-4 w-4" />Create</Link>
        </Button>
      </header>

      <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Partner</th>
              <th>Display Name</th>
              <th>Campaign</th>
              <th>Clicks</th>
              <th>Conversions</th>
              <th>CVR</th>
              <th>Revenue</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(links ?? []).map((l) => {
              const cvr = (l.click_count ?? 0) > 0 ? ((l.conversion_count ?? 0) / l.click_count) * 100 : 0;
              return (
                <tr key={l.id}>
                  <td className="font-mono text-xs">
                    <code>/go/{l.code}</code>
                  </td>
                  <td className="text-xs">{l.partner_id}</td>
                  <td>{l.display_name ?? '—'}</td>
                  <td className="text-xs text-muted-foreground">{l.campaign ?? '—'}</td>
                  <td className="num">{l.click_count}</td>
                  <td className="num">{l.conversion_count}</td>
                  <td className={`num ${cvr > 0.5 ? 'text-gain' : 'text-muted-foreground'}`}>{cvr.toFixed(2)}%</td>
                  <td className="num font-semibold">{formatCompact(l.total_revenue_usd ?? 0)}</td>
                  <td>
                    {l.is_active ? (
                      <Badge variant="success" className="text-[10px]">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                    )}
                  </td>
                  <td className="space-x-1">
                    <a href={`${SITE_URL}/go/${l.code}`} target="_blank" rel="noopener noreferrer" title="Test link" className="inline-block text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <Link href={`/admin/affiliate-links/${l.id}`} className="inline-block text-muted-foreground hover:text-foreground" title="Edit">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Tip: 各リンク URL は <code>{SITE_URL}/go/[code]</code> 形式. Cookie + S2S + Supabase の 3 層永続化で 10 年スパンの追跡可能.
      </p>
    </div>
  );
}
