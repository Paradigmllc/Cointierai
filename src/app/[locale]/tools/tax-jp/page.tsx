/**
 * /tools/tax-jp — Japanese miscellaneous-income tax estimator.
 *
 * Pro feature. Free preview: upload an exchange CSV, see total realised gain
 * + estimated tax bracket. PDF / detailed line items live behind /pricing.
 */
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { FileText, Lock } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { TaxJpClient } from '@/components/tools/TaxJpClient';
import type { Locale } from '@/i18n/routing';

export default async function TaxJpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  await getTranslations({ locale });
  const isJa = locale === 'ja';

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={isJa ? '日本 雑所得シミュレーター' : 'JP miscellaneous income tax'}
        subtitle={isJa ? 'bitFlyer / Coincheck / GMO / bitbank の CSV を投入 → 累進+住民税の概算' : 'Upload JP exchange CSV → progressive + resident tax estimate'}
        meta={<PageBadge><FileText className="h-3 w-3 mr-1" />Pro</PageBadge>}
      />
      <TaxJpClient locale={locale} />
      <section className="surface p-5 space-y-2 border-primary/30 bg-primary/5">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />{isJa ? '本格的な確定申告書作成は Pro で' : 'Full filing PDF — Pro plan'}</h3>
        <p className="text-[12px] text-muted-foreground">
          {isJa
            ? 'Free 版は損益総額・税額の試算まで。確定申告書類 (PDF)・移動平均法 vs 総平均法切替・複数年連結は Pro プランで提供します。'
            : 'Free tier estimates gains + tax due. Filing-ready PDF, moving-average ↔ total-average swap, and multi-year roll-up are Pro features.'}
        </p>
        <Link href="/pricing" className="inline-flex items-center text-[12px] text-primary hover:underline">
          {isJa ? 'Pro プランへ →' : 'Upgrade to Pro →'}
        </Link>
      </section>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'JP tax simulator | Cointier' };
}
