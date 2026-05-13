import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getRaises } from '@/lib/api/defillama';
import { formatCompact } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

export default async function IdoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const tTable = await getTranslations('table');
  const tHome = await getTranslations('home');

  const { raises } = await getRaises().catch(() => ({ raises: [] }));

  // Sort by date desc
  const sortedRaises = [...raises].sort((a, b) => b.date - a.date).slice(0, 200);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{tHome('upcomingIdos')}</h1>
        <p className="text-sm text-muted-foreground mt-1">VC funding rounds and token sales — data from DeFiLlama</p>
      </div>

      <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
        <table className="data-table">
          <thead>
            <tr>
              <th>{tTable('date')}</th>
              <th>Project</th>
              <th>Round</th>
              <th>Amount</th>
              <th>Valuation</th>
              <th>Lead Investors</th>
              <th>Sector</th>
            </tr>
          </thead>
          <tbody>
            {sortedRaises.map((r, idx) => (
              <tr key={`${r.name}-${r.date}-${idx}`}>
                <td className="num text-data-xs text-muted-foreground">
                  {new Date(r.date * 1000).toISOString().slice(0, 10)}
                </td>
                <td className="font-medium">{r.name}</td>
                <td className="text-muted-foreground text-data-xs">{r.round ?? '—'}</td>
                <td className="num font-medium">{r.amount ? formatCompact(r.amount) : '—'}</td>
                <td className="num text-muted-foreground">{r.valuation ? formatCompact(r.valuation) : '—'}</td>
                <td className="text-data-xs">{r.leadInvestors.slice(0, 2).join(', ') || '—'}</td>
                <td className="text-muted-foreground text-data-xs">{r.sector ?? r.category ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('ido') };
}
