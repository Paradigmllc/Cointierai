'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
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
        toast.success(locale === 'ja' ? '申請を受け付けました' : 'Application received');
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
        <h1 className="text-2xl font-bold">{locale === 'ja' ? '申請を受け付けました' : 'Application Received'}</h1>
        <p className="text-sm text-muted-foreground">
          {locale === 'ja' ? '24 時間以内に審査結果をご連絡します。' : 'You will hear back within 24 hours.'}
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
            <h1 className="text-2xl font-bold">pClaim — {locale === 'ja' ? 'プロジェクト・VC 公式登録' : 'Project / VC Official Listing'}</h1>
            <p className="text-xs text-muted-foreground">
              {locale === 'ja' ? '自社情報を Cointier に正式登録して、アジア最大の投資家層にリーチ' : 'Officially list with Cointier to reach Asia\'s largest investor base'}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PlanCard
          name="Free"
          price={locale === 'ja' ? '無料' : 'Free'}
          features={[
            locale === 'ja' ? 'Verified バッジ表示' : 'Verified badge',
            locale === 'ja' ? '基本情報編集権限' : 'Basic info edit',
            locale === 'ja' ? '月次閲覧数レポート' : 'Monthly view stats',
          ]}
        />
        <PlanCard
          name="Pro"
          price={locale === 'ja' ? '¥29,800/月' : '$199/month'}
          highlight
          features={[
            locale === 'ja' ? 'ロゴ・説明文プレミアム表示' : 'Premium logo & description',
            locale === 'ja' ? '競合比較ページで上位表示' : 'Top placement in comparisons',
            locale === 'ja' ? '投資家へのダイレクト CTA' : 'Direct investor CTA',
            locale === 'ja' ? '月次パフォーマンス分析' : 'Monthly performance reports',
            locale === 'ja' ? 'Slack 通知連携' : 'Slack notifications',
          ]}
        />
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-border/60 bg-card/30 p-5 space-y-4">
        <h2 className="font-semibold">{locale === 'ja' ? '申請フォーム' : 'Application form'}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{locale === 'ja' ? '種別' : 'Type'}</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'project' | 'vc' })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="project">{locale === 'ja' ? 'プロジェクト (発行体)' : 'Project (Issuer)'}</option>
              <option value="vc">{locale === 'ja' ? 'VC (投資家)' : 'VC (Investor)'}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{locale === 'ja' ? 'プラン' : 'Plan'}</label>
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
          <label className="text-xs font-medium">{locale === 'ja' ? 'プロジェクト / VC 名' : 'Project / VC Name'}</label>
          <Input value={form.project_or_vc_name} onChange={(e) => setForm({ ...form, project_or_vc_name: e.target.value })} required />
        </div>

        {form.type === 'project' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{locale === 'ja' ? '対象トークンスラッグ' : 'Coin Slug'}</label>
            <Input
              value={form.coin_slug}
              onChange={(e) => setForm({ ...form, coin_slug: e.target.value })}
              placeholder="bitcoin / ethereum / your-token"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium">{locale === 'ja' ? '公式サイト URL' : 'Official Website'}</label>
          <Input type="url" value={form.company_website} onChange={(e) => setForm({ ...form, company_website: e.target.value })} required placeholder="https://" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{locale === 'ja' ? '担当者名' : 'Contact Name'}</label>
            <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{locale === 'ja' ? '連絡先メール' : 'Contact Email'}</label>
            <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">{locale === 'ja' ? 'メッセージ (任意)' : 'Message (optional)'}</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (locale === 'ja' ? '送信中…' : 'Submitting…') : (locale === 'ja' ? '申請する' : 'Submit')}
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
