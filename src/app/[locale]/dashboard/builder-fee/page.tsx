import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Zap, TrendingUp, Users, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createAuthSupabase, getCurrentUser } from '@/lib/auth/supabase-server';
import { getBuilderRevenue } from '@/lib/wallet/hyperliquid-client';
import { formatCompact } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

/**
 * Builder Fee Revenue Dashboard (admin / Cointier 運営者向け)
 *
 * 表示:
 *   - 承認済ユーザー数 (builder_fee_approvals テーブル count)
 *   - 取引量合計 (trades from source=hyperliquid)
 *   - 累計 Builder Fee 収益 (推定)
 *   - ユーザー別取引履歴
 */
export default async function BuilderFeeDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tT = await getTranslations({ locale });
  setRequestLocale(locale as Locale);
  const session = await getCurrentUser();
  if (!session) redirect(`/${locale}/auth/login?redirect=/dashboard/builder-fee`);

  const supabase = await createAuthSupabase();

  // 承認済 wallet 数
  const { count: approvalCount } = await supabase
    .from('builder_fee_approvals')
    .select('*', { count: 'exact', head: true })
    .is('revoked_at', null)
    .eq('protocol', 'hyperliquid');

  // 取引履歴集計
  const { data: trades } = await supabase
    .from('trades')
    .select('amount, price_usd, fee_usd, executed_at')
    .eq('source', 'hyperliquid')
    .gte('executed_at', new Date(Date.now() - 30 * 86_400_000).toISOString());

  const totalNotional = (trades ?? []).reduce((s, t) => s + (t.amount ?? 0) * (t.price_usd ?? 0), 0);
  const totalFees = (trades ?? []).reduce((s, t) => s + (t.fee_usd ?? 0), 0);
  const estimatedBuilderRevenue = totalNotional * 0.00035; // 0.035%

  return (
    <div className="container py-4 max-w-4xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{tT('dashBuilder-fee.builderFeeRevenue')}</h1>
          <p className="text-xs text-muted-foreground">
            {tT('dashBuilder-fee.autoCollectedFromHyperliquidTrades')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Users className="h-4 w-4 text-primary" />} label={tT('dashBuilder-fee.approvedUsers')} value={String(approvalCount ?? 0)} />
        <StatCard icon={<Activity className="h-4 w-4 text-gain" />} label={tT('dashBuilder-fee.30dNotional')} value={formatCompact(totalNotional)} />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-tier-d" />} label={tT('dashBuilder-fee.estRevenue')} value={`$${estimatedBuilderRevenue.toFixed(2)}`} highlight />
        <StatCard icon={<Activity className="h-4 w-4 text-muted-foreground" />} label={tT('dashBuilder-fee.30dFees')} value={formatCompact(totalFees)} />
      </div>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-2">
        <h2 className="font-semibold text-sm">{tT('dashBuilder-fee.howItWorks')}</h2>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>· {tT('dashBuilder-fee.userSignsEip712Approving')}</li>
          <li>· {tT('dashBuilder-fee.autoCollectedOnChainOn')}</li>
          <li>· {tT('dashBuilder-fee.permanentUntilUserExplicitlyRevokes')}</li>
          <li>· {tT('dashBuilder-fee.smartContractEnforcesTheRate')}</li>
        </ul>
      </div>

      <Badge variant="secondary" className="text-[10px]">
        {tT('dashBuilder-fee.m4M6BuilderAddressRegistration')}
      </Badge>
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card/30'} p-3`}>
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{label}</span>
        {icon}
      </div>
      <div className="num text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
