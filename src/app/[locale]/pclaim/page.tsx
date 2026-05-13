'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Building2, Verified, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

/**
 * pClaim B2B 申請フォーム (Notion L1048-1066)
 *
 * VC・Web3 プロジェクト向け:
 *   - 無料 Claim: Verified バッジ + 基本編集
 *   - Pro Claim ¥29,800/月: プレミアム表示・競合上位・月次レポート
 *
 * コールドアウトリーチ文面:
 *   「御社の Cointier ページ、情報が古くなっています」→ 申請誘導
 */
export default function PClaimPage() {
  const tT = useTranslations();
  const locale = useLocale();
  const [form, setForm] = useState({
    project_or_vc_name: '',
    type: 'project' as 'project' | 'vc',
    coin_slug: '',
    contact_email: '',
    contact_name: '',
    plan: 'free' as 'free' | 'pro',
    company_website: '',
    note: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/pclaim/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success(tT('pclaim.applicationReceived'));
      } else {
        toast.error('Submission failed');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container py-16 max-w-md text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-gain mx-auto" />
        <h1 className="text-2xl font-bold">{tT('pclaim.applicationReceived2')}</h1>
        <p className="text-sm text-muted-foreground">
          {tT('pclaim.youWillHearBackWithin')}
        </p>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-2xl space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">pClaim — {tT('pclaim.projectVcOfficialListing')}</h1>
            <p className="text-xs text-muted-foreground">
              {locale === 'ja' ? '自社情報を Cointier に正式登録して、アジア最大の投資家層にリーチ' : 'Officially list with Cointier to reach Asia\'s largest investor base'}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PlanCard
          name="Free"
          price={tT('pclaim.free')}
          features={[
            tT('pclaim.verifiedBadge'),
            tT('pclaim.basicInfoEdit'),
            tT('pclaim.monthlyViewStats'),
          ]}
        />
        <PlanCard
          name="Pro"
          price={tT('pclaim.199Month')}
          highlight
          features={[
            tT('pclaim.premiumLogoDescription'),
            tT('pclaim.topPlacementInComparisons'),
            tT('pclaim.directInvestorCta'),
            tT('pclaim.monthlyPerformanceReports'),
            tT('pclaim.slackNotifications'),
          ]}
        />
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-border/60 bg-card/30 p-5 space-y-4">
        <h2 className="font-semibold">{tT('pclaim.applicationForm')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{tT('pclaim.type')}</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'project' | 'vc' })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="project">{tT('pclaim.projectIssuer')}</option>
              <option value="vc">{tT('pclaim.vcInvestor')}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{tT('pclaim.plan')}</label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value as 'free' | 'pro' })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="free">Free</option>
              <option value="pro">Pro (¥29,800/月)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">{tT('pclaim.projectVcName')}</label>
          <Input value={form.project_or_vc_name} onChange={(e) => setForm({ ...form, project_or_vc_name: e.target.value })} required />
        </div>

        {form.type === 'project' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{tT('pclaim.coinSlug')}</label>
            <Input
              value={form.coin_slug}
              onChange={(e) => setForm({ ...form, coin_slug: e.target.value })}
              placeholder="bitcoin / ethereum / your-token"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium">{tT('pclaim.officialWebsite')}</label>
          <Input type="url" value={form.company_website} onChange={(e) => setForm({ ...form, company_website: e.target.value })} required placeholder="https://" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{tT('pclaim.contactName')}</label>
            <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{tT('pclaim.contactEmail')}</label>
            <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">{tT('pclaim.messageOptional')}</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (tT('pclaim.submitting')) : (tT('pclaim.submit'))}
        </Button>
      </form>
    </div>
  );
}

function PlanCard({ name, price, features, highlight = false }: { name: string; price: string; features: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 space-y-3 ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card/30'}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{name}</h3>
        {highlight && <Badge>Recommended</Badge>}
      </div>
      <div className="text-2xl font-bold">{price}</div>
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <Verified className="h-3 w-3 text-gain shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
