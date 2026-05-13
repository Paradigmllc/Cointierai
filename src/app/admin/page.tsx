import Link from 'next/link';
import { Link2, Users, Coins, TrendingUp, MousePointerClick } from 'lucide-react';
import { createServiceSupabase } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = createServiceSupabase();
  const [coinsRes, usersRes, clicksRes, conversionsRes, linksRes] = await Promise.all([
    supabase.from('coins').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('affiliate_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', new Date(Date.now() - 30 * 86_400_000).toISOString()),
    supabase.from('affiliate_clicks').select('conversion_value_usd', { count: 'exact' }).not('converted_at', 'is', null).gte('clicked_at', new Date(Date.now() - 30 * 86_400_000).toISOString()),
    supabase.from('affiliate_links').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const revenue = (conversionsRes.data ?? []).reduce((s, c) => s + (c.conversion_value_usd ?? 0), 0);

  const stats = [
    { label: 'Coins', value: coinsRes.count ?? 0, icon: <Coins className="h-4 w-4" /> },
    { label: 'Users', value: usersRes.count ?? 0, icon: <Users className="h-4 w-4" /> },
    { label: 'Active Links', value: linksRes.count ?? 0, icon: <Link2 className="h-4 w-4" /> },
    { label: 'Clicks (30d)', value: clicksRes.count ?? 0, icon: <MousePointerClick className="h-4 w-4" /> },
    { label: 'Conversions (30d)', value: conversionsRes.count ?? 0, icon: <TrendingUp className="h-4 w-4 text-gain" /> },
    { label: 'Revenue (30d)', value: `$${revenue.toFixed(2)}`, icon: <TrendingUp className="h-4 w-4 text-gain" /> },
  ];

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Cointier Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">運用ダッシュボード</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border/60 bg-card/30 p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>{s.label}</span>
              {s.icon}
            </div>
            <div className="num text-2xl font-bold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link href="/admin/affiliate-links" className="rounded-lg border border-border/60 bg-card/30 p-5 hover:border-primary/40 transition-colors">
          <h3 className="font-semibold">Affiliate Links</h3>
          <p className="text-xs text-muted-foreground mt-1">/go/* リンクの作成・編集・統計</p>
        </Link>
        <Link href="/admin/affiliate-analytics" className="rounded-lg border border-border/60 bg-card/30 p-5 hover:border-primary/40 transition-colors">
          <h3 className="font-semibold">Analytics</h3>
          <p className="text-xs text-muted-foreground mt-1">Click / Conversion / Revenue 分析</p>
        </Link>
      </div>
    </div>
  );
}
