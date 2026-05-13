/**
 * /airdrops — curated airdrop tracker.
 *
 * Data currently empty (DappRadar requires paid key for airdrop endpoint).
 * Page renders the schema + empty state so the route is indexable & ready for
 * curated Supabase entries / community submissions.
 */
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Gift, Calendar } from 'lucide-react';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { getAirdrops } from '@/lib/api/dappradar';
import type { Locale } from '@/i18n/routing';

export const revalidate = 1800;

export default async function AirdropsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  await getTranslations({ locale });

  const upcoming = await getAirdrops('upcoming');
  const active = await getAirdrops('active');

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'エアドロップ追跡' : 'Airdrop tracker'}
        subtitle={`${active.length} active · ${upcoming.length} upcoming`}
        meta={<PageBadge>Curated</PageBadge>}
      />
      {upcoming.length === 0 && active.length === 0 ? (
        <div className="surface p-12 text-center space-y-2">
          <Gift className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-sm font-semibold">{locale === 'ja' ? '近日公開' : 'Coming soon'}</h3>
          <p className="text-[12px] text-muted-foreground max-w-md mx-auto">
            {locale === 'ja'
              ? 'Cointier ではキュレーション済みエアドロップ情報を準備中。CryptoPanic + 自社調査ベースで毎日更新予定。'
              : 'Curated airdrop tracker is in preparation. Watch CryptoPanic + on-chain attestations.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...active, ...upcoming].map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="surface p-4 hover:shadow-card transition-shadow space-y-2"
            >
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="font-semibold">{a.name}</span>
                <Badge
                  className={
                    a.status === 'active'
                      ? 'bg-gain/10 text-gain border-gain/30'
                      : 'bg-tier-a/10 text-tier-a border-tier-a/30'
                  }
                >
                  {a.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{a.startDate.slice(0, 10)}{a.endDate ? ` → ${a.endDate.slice(0, 10)}` : ''}</span>
              </div>
              {a.description && <p className="text-[12px] text-foreground/80 line-clamp-3">{a.description}</p>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Airdrops | Cointier' };
}
