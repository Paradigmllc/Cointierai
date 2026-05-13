import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Globe, Twitter, MapPin, TrendingUp, Briefcase, DollarSign, Star } from 'lucide-react';
import { createServerSupabase } from '@/lib/db/supabase';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '@/components/coin/TierBadge';
import { formatCompact, cn } from '@/lib/utils';
import { breadcrumbLd, articleLd, ldScript } from '@/lib/seo/jsonld';
import type { Locale } from '@/i18n/routing';
import type { Tier } from '@/types/database';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

export const revalidate = 86_400;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * VC fund profile — Bento layout with portfolio metrics, asia focus badge,
 * and a deal-history table. Designed to mirror the coin detail page so the
 * visual language stays consistent across the catalog (coins ⇄ VCs).
 */
export default async function VcProfilePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const tCommon = await getTranslations('common');
  const tNav = await getTranslations('nav');

  const supabase = await createServerSupabase();
  const { data: vc } = await supabase.from('vc_funds').select('*').eq('slug', slug).maybeSingle();
  if (!vc) notFound();

  // Pull this VC's actual investments — join through funding_rounds.coin_id.
  // Without a dedicated funding_round_investors join table we fall back to
  // a coarse global recent-rounds view; refined join lands when RootData
  // ingestion populates the link table in M3-M4.
  const { data: rounds } = await supabase
    .from('funding_rounds')
    .select('coin_id, amount_usd, round_type, valuation_usd, date, coins(symbol, name, image_url, tier)')
    .order('date', { ascending: false })
    .limit(100);

  const url = `${SITE_URL}/${locale}/vc/${slug}`;
  const descTxt =
    (vc.description as Record<string, string> | null)?.[locale] ??
    (vc.description as Record<string, string> | null)?.en ??
    '';

  const isJa = locale === 'ja';
  const totalInvested = vc.total_invested_usd ?? 0;
  const avgCheck = vc.portfolio_count > 0 && totalInvested > 0 ? totalInvested / vc.portfolio_count : null;

  return (
    <div className="container py-6 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={ldScript([
          breadcrumbLd([
            { name: tCommon('siteName'), url: `/${locale}` },
            { name: tNav('vcs'), url: `/${locale}/vcs` },
            { name: vc.name, url: `/${locale}/vc/${slug}` },
          ]),
          articleLd({
            title: `${vc.name} — VC Profile · Cointier`,
            description: descTxt || `${vc.name} crypto VC portfolio and investment history.`,
            url,
            locale,
          }),
        ])}
      />

      {/* Hero */}
      <section className="surface p-6 space-y-5">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <Briefcase className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-[32px] font-semibold tracking-tight leading-none">{vc.name}</h1>
                {vc.is_asia && (
                  <Badge variant="secondary" className="text-[10px] bg-tier-s/15 text-tier-s border-tier-s/30">
                    Asia-focused
                  </Badge>
                )}
                {vc.country && (
                  <Badge variant="outline" className="text-[10px]">
                    <MapPin className="h-3 w-3 mr-1" />
                    {vc.country}
                  </Badge>
                )}
              </div>
              {descTxt && <p className="text-[13px] text-muted-foreground max-w-2xl leading-relaxed">{descTxt}</p>}
            </div>
          </div>
          <div className="md:ml-auto flex flex-wrap items-center gap-3">
            {vc.website && (
              <a
                href={vc.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-[12px] font-medium hover:bg-accent transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                Website
              </a>
            )}
            {vc.twitter_url && (
              <a
                href={vc.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-[12px] font-medium hover:bg-accent transition-colors"
              >
                <Twitter className="h-3.5 w-3.5" />
                Twitter
              </a>
            )}
          </div>
        </div>

        {/* KPI Bento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile icon={<Briefcase className="h-3.5 w-3.5 text-primary" />} label={isJa ? 'ポートフォリオ' : 'Portfolio'} value={`${vc.portfolio_count}`} sub={isJa ? '銘柄' : 'projects'} />
          <KpiTile icon={<DollarSign className="h-3.5 w-3.5 text-gain" />} label={isJa ? '累計投資' : 'Total invested'} value={totalInvested > 0 ? formatCompact(totalInvested) : '—'} />
          <KpiTile icon={<TrendingUp className="h-3.5 w-3.5 text-tier-a" />} label={isJa ? '平均出資額' : 'Avg check'} value={avgCheck ? formatCompact(avgCheck) : '—'} />
          <KpiTile icon={<Star className="h-3.5 w-3.5 text-tier-d" />} label={isJa ? '地域' : 'Region'} value={vc.is_asia ? 'Asia' : 'Global'} />
        </div>
      </section>

      {/* Recent investments table */}
      <section className="surface p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="section-heading flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isJa ? '最近の投資' : 'Recent investments'}
          </h2>
          <span className="text-[11px] text-muted-foreground">{rounds?.length ?? 0} {isJa ? '件' : 'rounds'}</span>
        </div>
        <div className="overflow-x-auto thin-scrollbar">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="text-left">{isJa ? '日付' : 'Date'}</th>
                <th className="text-left">{isJa ? 'プロジェクト' : 'Project'}</th>
                <th className="text-left">{isJa ? 'ラウンド' : 'Round'}</th>
                <th className="text-right">{isJa ? '調達額' : 'Amount'}</th>
                <th className="text-right">{isJa ? '評価額' : 'Valuation'}</th>
                <th className="text-center">Tier</th>
              </tr>
            </thead>
            <tbody>
              {(rounds ?? []).slice(0, 50).map((r, i) => {
                const coin = r.coins as unknown as
                  | { symbol: string; name: string; image_url: string | null; tier: Tier | null }
                  | null;
                return (
                  <tr key={`${r.coin_id}-${i}`}>
                    <td className="text-muted-foreground text-[11px]">{r.date}</td>
                    <td>
                      <Link href={`/coin/${r.coin_id}`} className="inline-flex items-center gap-2 min-w-0 hover:text-primary transition-colors">
                        {coin?.image_url && (
                          <Image src={coin.image_url} alt={coin.symbol} width={18} height={18} className="rounded-full shrink-0" unoptimized />
                        )}
                        <span className="font-medium text-[12px] truncate">{coin?.name ?? '—'}</span>
                        {coin && <span className="text-[10px] text-muted-foreground uppercase shrink-0">{coin.symbol}</span>}
                      </Link>
                    </td>
                    <td>
                      <span className={cn('inline-block px-2 py-0.5 rounded text-[11px] font-medium border bg-muted border-border')}>
                        {r.round_type ?? '—'}
                      </span>
                    </td>
                    <td className="num text-right tabular-nums font-medium text-[12px]">
                      {r.amount_usd ? formatCompact(r.amount_usd) : '—'}
                    </td>
                    <td className="num text-right tabular-nums text-[11px] text-muted-foreground">
                      {r.valuation_usd ? formatCompact(r.valuation_usd) : '—'}
                    </td>
                    <td className="text-center">{coin?.tier ? <TierBadge tier={coin.tier} size="sm" /> : '—'}</td>
                  </tr>
                );
              })}
              {(!rounds || rounds.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center text-[12px] text-muted-foreground py-6">
                    {isJa ? '投資履歴データがまだありません' : 'No investment history on file yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 text-[10px] text-muted-foreground border-t border-border bg-subtle">
          {isJa
            ? '出典: DeFiLlama Raises 集計 · RootData 統合は M3-M4 で投資家別 join を高精度化'
            : 'Aggregated from DeFiLlama Raises · RootData per-investor join arrives in M3-M4'}
        </div>
      </section>
    </div>
  );
}

function KpiTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-subtle p-4 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {icon}
        {label}
      </div>
      <div className="num font-semibold tabular-nums text-lg md:text-xl leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const supabase = await createServerSupabase();
  const { data: vc } = await supabase.from('vc_funds').select('name').eq('slug', slug).maybeSingle();
  return {
    title: vc?.name ?? slug,
    alternates: {
      canonical: `${SITE_URL}/${locale}/vc/${slug}`,
      languages: Object.fromEntries(['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'].map((l) => [l, `${SITE_URL}/${l}/vc/${slug}`])),
    },
  };
}
