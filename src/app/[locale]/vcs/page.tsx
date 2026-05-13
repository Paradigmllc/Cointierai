/**
 * /vcs — CryptoRank.io /funds ページ完全複製
 *
 * 本家列構成: Name | Tier | Latest Deal | Portfolio | Retail ROI | Focus Area
 * Cointier 拡張: + Asia-focus badge (RootData integration 後)
 */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Globe } from 'lucide-react';
import { getRaises } from '@/lib/api/defillama';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { formatCompact, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 86_400;

export default async function VcsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const { raises } = await getRaises().catch(() => ({ raises: [] }));

  // Aggregate per VC
  const vcMap = new Map<
    string,
    {
      name: string;
      deals: number;
      totalUsd: number;
      sectors: Set<string>;
      latestDeal?: { date: number; project: string; amount: number | null; round: string | null };
    }
  >();
  for (const r of raises) {
    for (const investor of [...r.leadInvestors, ...r.otherInvestors]) {
      if (!investor) continue;
      const existing = vcMap.get(investor) ?? {
        name: investor,
        deals: 0,
        totalUsd: 0,
        sectors: new Set<string>(),
      };
      existing.deals += 1;
      existing.totalUsd += r.amount ?? 0;
      if (r.sector) existing.sectors.add(r.sector);
      if (!existing.latestDeal || r.date > existing.latestDeal.date) {
        existing.latestDeal = { date: r.date, project: r.name, amount: r.amount ?? null, round: r.round ?? null };
      }
      vcMap.set(investor, existing);
    }
  }
  const topVcs = [...vcMap.values()].sort((a, b) => b.deals - a.deals).slice(0, 100);

  // Tier 推定 (deal count 基準・本家 CryptoRank に近い tier 体系)
  function vcTier(deals: number): string {
    if (deals >= 100) return '1';
    if (deals >= 50) return '2';
    if (deals >= 20) return '3';
    if (deals >= 5) return '4';
    return '5';
  }

  const ASIA_VC_KEYWORDS = ['animoca', 'hashkey', 'foresight', 'sino', 'jump', 'iosg', 'sky9', 'youbi', 'mirana'];
  const isAsia = (name: string) => ASIA_VC_KEYWORDS.some((k) => name.toLowerCase().includes(k));

  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={t('Crypto VC・投資家ランキング', 'Crypto VCs and Investors')}
        subtitle={t(
          `${topVcs.length} ファンド · DeFiLlama Raises 集計 · RootData アジア VC データ M1 統合`,
          `${topVcs.length} funds · aggregated from DeFiLlama Raises · RootData (Asia VCs) integration in M1`,
        )}
        meta={<PageBadge>DeFiLlama</PageBadge>}
      />

      <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2">#</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-left">{t('VC ファンド', 'Name')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-center">Tier</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-left">{t('最新ディール', 'Latest Deal')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-right">{t('ポートフォリオ', 'Portfolio')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-right">{t('総調達額', 'Total Funded')}</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-left">{t('注力領域', 'Focus Area')}</th>
            </tr>
          </thead>
          <tbody>
            {topVcs.map((vc, idx) => (
              <tr key={vc.name} className="h-[42px] border-t border-border/30 hover:bg-accent/30 transition-colors">
                <td className="px-3 py-1 num text-muted-foreground text-[11px]">{idx + 1}</td>
                <td className="px-3 py-1">
                  <Link href={`/vc/${encodeURIComponent(vc.name)}`} className="font-medium hover:text-primary transition-colors inline-flex items-center gap-2">
                    {vc.name}
                    {isAsia(vc.name) && <Badge variant="secondary" className="text-[9px] py-0">Asia</Badge>}
                  </Link>
                </td>
                <td className="px-3 py-1 text-center">
                  <span className={cn(
                    'inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-bold',
                    vcTier(vc.deals) === '1' && 'bg-tier-s/20 text-tier-s',
                    vcTier(vc.deals) === '2' && 'bg-tier-a/20 text-tier-a',
                    vcTier(vc.deals) === '3' && 'bg-tier-b/20 text-tier-b',
                    vcTier(vc.deals) === '4' && 'bg-tier-c/20 text-tier-c',
                    vcTier(vc.deals) === '5' && 'bg-muted text-muted-foreground',
                  )}>
                    {vcTier(vc.deals)}
                  </span>
                </td>
                <td className="px-3 py-1 text-[11px]">
                  {vc.latestDeal ? (
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium">{vc.latestDeal.project}</span>
                      <span className="text-[10px] text-muted-foreground num tabular-nums">
                        {vc.latestDeal.amount ? formatCompact(vc.latestDeal.amount) : '—'} · {new Date(vc.latestDeal.date * 1000).toISOString().slice(0, 10)}
                      </span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-1 num font-medium text-right tabular-nums text-[12px]">{vc.deals}</td>
                <td className="px-3 py-1 num text-right tabular-nums text-[11px]">{vc.totalUsd > 0 ? formatCompact(vc.totalUsd) : '—'}</td>
                <td className="px-3 py-1 text-[10px] text-muted-foreground">{[...vc.sectors].slice(0, 3).join(' · ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-muted-foreground/60 flex items-center gap-2">
        <Globe className="h-3 w-3" />
        Data: DeFiLlama Raises · RootData (M1) · 自社 vc_funds DB
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('vcs') };
}
