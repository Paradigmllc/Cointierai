/**
 * /ido — Cointier IDO/ICO calendar.
 *
 * Columns: Date | Project | Round | Amount | Valuation | Lead investors | Sector | Status
 */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getRaises } from '@/lib/api/defillama';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { formatCompact, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

export default async function IdoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const { raises } = await getRaises().catch(() => ({ raises: [] }));
  const sortedRaises = [...raises].sort((a, b) => b.date - a.date).slice(0, 300);

  const tT = await getTranslations({ locale });

  const now = Date.now() / 1000;
  function statusOf(date: number): { label: string; color: string } {
    const days = (now - date) / 86_400;
    if (days < 0) return { label: tT('ido.upcoming'), color: 'bg-tier-a/20 text-tier-a' };
    if (days < 7) return { label: tT('ido.recent'), color: 'bg-gain/15 text-gain' };
    if (days < 30) return { label: tT('ido.thisMonth'), color: 'bg-tier-d/15 text-tier-d' };
    return { label: tT('ido.closed'), color: 'bg-muted text-muted-foreground' };
  }

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={tT('ido.idoCalendarFundingRounds')}
        subtitle={`${sortedRaises.length} · DeFiLlama Raises · CryptoRank IDO API (M1)`}
        meta={<PageBadge>DeFiLlama</PageBadge>}
      />

      <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-left">{tT('ido.date')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-left">{tT('ido.project')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-left">{tT('ido.round')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-right">{tT('ido.amount')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-right">{tT('ido.valuation')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-left">{tT('ido.leadInvestors')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-left">{tT('ido.sector')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-center">{tT('ido.status')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedRaises.map((r, idx) => {
              const status = statusOf(r.date);
              return (
                <tr key={`${r.name}-${r.date}-${idx}`} className="h-[42px] border-t border-border/30 hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-1 num text-[10px] text-muted-foreground tabular-nums">
                    {new Date(r.date * 1000).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-3 py-1 font-medium text-[12px]">{r.name}</td>
                  <td className="px-3 py-1 text-muted-foreground text-[10px]">{r.round ?? '—'}</td>
                  <td className="px-3 py-1 num font-medium text-right tabular-nums text-[11px]">{r.amount ? formatCompact(r.amount) : '—'}</td>
                  <td className="px-3 py-1 num text-right tabular-nums text-[11px] text-muted-foreground">{r.valuation ? formatCompact(r.valuation) : '—'}</td>
                  <td className="px-3 py-1 text-[10px] truncate max-w-[200px]">{r.leadInvestors.slice(0, 2).join(', ') || '—'}</td>
                  <td className="px-3 py-1 text-muted-foreground text-[10px]">{r.sector ?? r.category ?? '—'}</td>
                  <td className="px-3 py-1 text-center">
                    <Badge className={cn('text-[9px] py-0', status.color)} variant="secondary">
                      {status.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
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
