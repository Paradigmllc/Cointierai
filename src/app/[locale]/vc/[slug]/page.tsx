import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Globe, Twitter, MapPin } from 'lucide-react';
import { createServerSupabase } from '@/lib/db/supabase';
import { Badge } from '@/components/ui/badge';
import { formatCompact } from '@/lib/utils';
import { breadcrumbLd, articleLd, ldScript } from '@/lib/seo/jsonld';
import type { Locale } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

export const revalidate = 86_400;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function VcProfilePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const tCommon = await getTranslations('common');
  const tNav = await getTranslations('nav');

  const supabase = await createServerSupabase();
  const { data: vc } = await supabase.from('vc_funds').select('*').eq('slug', slug).maybeSingle();
  if (!vc) notFound();

  // VC の investments を funding_round_investors 経由で取得 (現状簡易版: 名前ベース集計)
  const { data: rounds } = await supabase
    .from('funding_rounds')
    .select('coin_id, amount_usd, round_type, date, coins(symbol, name, image_url, tier)')
    .order('date', { ascending: false })
    .limit(100);

  const url = `${SITE_URL}/${locale}/vc/${slug}`;
  const descTxt = (vc.description as Record<string, string>)?.[locale] ?? (vc.description as Record<string, string>)?.en ?? '';

  return (
    <div className="container py-4 space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript([
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
      ])} />

      <header className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl md:text-2xl font-semibold">{vc.name}</h1>
          {vc.is_asia && <Badge variant="secondary">Asia-focused</Badge>}
          {vc.country && (
            <Badge variant="outline">
              <MapPin className="h-3 w-3 mr-1" />
              {vc.country}
            </Badge>
          )}
        </div>
        {descTxt && <p className="text-sm text-muted-foreground max-w-3xl">{descTxt}</p>}
        <div className="flex gap-4 text-sm">
          {vc.website && (
            <a href={vc.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              Website
            </a>
          )}
          {vc.twitter_url && (
            <a href={vc.twitter_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              <Twitter className="h-3.5 w-3.5" />
              Twitter
            </a>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/60 bg-card/30 p-3">
          <div className="text-xs text-muted-foreground">Portfolio</div>
          <div className="text-xl font-semibold">{vc.portfolio_count} projects</div>
        </div>
        {vc.total_invested_usd && (
          <div className="rounded-lg border border-border/60 bg-card/30 p-3">
            <div className="text-xs text-muted-foreground">Total Invested</div>
            <div className="text-xl font-semibold num">{formatCompact(vc.total_invested_usd)}</div>
          </div>
        )}
        <div className="rounded-lg border border-border/60 bg-card/30 p-3">
          <div className="text-xs text-muted-foreground">Region focus</div>
          <div className="text-xl font-semibold">{vc.is_asia ? 'Asia' : 'Global'}</div>
        </div>
      </div>

      {/* Recent rounds */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recent Investments</h2>
        <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Round</th>
                <th>Amount</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {(rounds ?? []).map((r, i) => {
                const coin = r.coins as unknown as { symbol: string; name: string; tier: string | null } | null;
                return (
                  <tr key={`${r.coin_id}-${i}`}>
                    <td className="text-muted-foreground text-data-xs">{r.date}</td>
                    <td>
                      {coin && (
                        <Link href={`/coin/${r.coin_id}`} className="hover:text-primary">
                          {coin.name} ({coin.symbol.toUpperCase()})
                        </Link>
                      )}
                    </td>
                    <td className="text-data-xs">{r.round_type}</td>
                    <td className="num">{r.amount_usd ? formatCompact(r.amount_usd) : '—'}</td>
                    <td>{coin?.tier ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
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
