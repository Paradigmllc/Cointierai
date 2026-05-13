import { createServiceSupabase } from '@/lib/db/supabase';
import { formatCompact } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PartnerRow { partner_id: string; clicks: number; conversions: number; revenue_usd: number; cvr: number }

export default async function AnalyticsPage() {
  const supabase = createServiceSupabase();
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [{ data: clicks }, { data: conversions }, { data: partners }] = await Promise.all([
    supabase.from('affiliate_clicks').select('partner_id, converted_at, conversion_value_usd').gte('clicked_at', since30),
    supabase.from('affiliate_conversions').select('partner_id, value_usd, payout_usd').gte('postback_at', since30),
    supabase.from('affiliate_partners').select('id, name'),
  ]);

  // Partner 別集計
  const map = new Map<string, PartnerRow>();
  for (const c of clicks ?? []) {
    const row = map.get(c.partner_id) ?? { partner_id: c.partner_id, clicks: 0, conversions: 0, revenue_usd: 0, cvr: 0 };
    row.clicks += 1;
    if (c.converted_at) {
      row.conversions += 1;
      row.revenue_usd += c.conversion_value_usd ?? 0;
    }
    map.set(c.partner_id, row);
  }
  const rows = [...map.values()]
    .map((r) => ({ ...r, cvr: r.clicks > 0 ? (r.conversions / r.clicks) * 100 : 0 }))
    .sort((a, b) => b.revenue_usd - a.revenue_usd);

  const partnerName = (id: string) => partners?.find((p) => p.id === id)?.name ?? id;
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalConversions = rows.reduce((s, r) => s + r.conversions, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue_usd, 0);

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Affiliate Analytics</h1>
        <p className="text-xs text-muted-foreground mt-1">過去 30 日間のクリック・コンバージョン・売上分析</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Clicks" value={totalClicks.toLocaleString()} />
        <StatBox label="Conversions" value={totalConversions.toLocaleString()} />
        <StatBox label="CVR" value={`${totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0'}%`} />
        <StatBox label="Revenue" value={`$${totalRevenue.toFixed(2)}`} highlight />
      </div>

      <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
        <table className="data-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Clicks</th>
              <th>Conversions</th>
              <th>CVR</th>
              <th>Revenue</th>
              <th>EPC</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No data yet. Send some clicks via /go/*</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.partner_id}>
                  <td className="font-semibold">{partnerName(r.partner_id)}</td>
                  <td className="num">{r.clicks.toLocaleString()}</td>
                  <td className="num">{r.conversions.toLocaleString()}</td>
                  <td className="num">{r.cvr.toFixed(2)}%</td>
                  <td className="num font-semibold">{formatCompact(r.revenue_usd)}</td>
                  <td className="num text-muted-foreground">${r.clicks > 0 ? (r.revenue_usd / r.clicks).toFixed(3) : '0'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card/30'}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="num text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
