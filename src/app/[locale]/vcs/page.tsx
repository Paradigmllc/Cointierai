import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getRaises } from '@/lib/api/defillama';
import { formatCompact } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 86_400;

export default async function VcsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const tNav = await getTranslations('nav');

  // Aggregate VC investments from DeFiLlama Raises
  // (本格版は RootData API + 自社 vc_funds テーブル参照)
  const { raises } = await getRaises().catch(() => ({ raises: [] }));

  const vcCounts = new Map<string, { name: string; deals: number; totalUsd: number; sectors: Set<string> }>();
  for (const r of raises) {
    for (const investor of [...r.leadInvestors, ...r.otherInvestors]) {
      if (!investor) continue;
      const existing = vcCounts.get(investor) ?? { name: investor, deals: 0, totalUsd: 0, sectors: new Set<string>() };
      existing.deals += 1;
      existing.totalUsd += r.amount ?? 0;
      if (r.sector) existing.sectors.add(r.sector);
      vcCounts.set(investor, existing);
    }
  }
  const topVcs = [...vcCounts.values()].sort((a, b) => b.deals - a.deals).slice(0, 100);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{tNav('vcs')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Top VC investors in crypto · ranked by deal count · DeFiLlama Raises
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Full Asia-focused profiles (Animoca, HashKey, Foresight, etc) coming via RootData integration in M1.
        </p>
      </div>

      <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>VC</th>
              <th>Deals</th>
              <th>Total Funding</th>
              <th>Sectors</th>
            </tr>
          </thead>
          <tbody>
            {topVcs.map((vc, idx) => (
              <tr key={vc.name}>
                <td className="num text-muted-foreground">{idx + 1}</td>
                <td className="font-medium">{vc.name}</td>
                <td className="num">{vc.deals}</td>
                <td className="num font-medium">{vc.totalUsd > 0 ? formatCompact(vc.totalUsd) : '—'}</td>
                <td className="text-data-xs text-muted-foreground">{[...vc.sectors].slice(0, 3).join(', ')}</td>
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
  return { title: t('vcs') };
}
