import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Globe, FileText, Github, Twitter, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TierBadge } from '@/components/coin/TierBadge';
import { getCoinDetail } from '@/lib/api/coingecko';
import { formatPrice, formatCompact, formatPercent, formatSupply, changeColor, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import type { Tier } from '@/types/database';

export const revalidate = 600; // 10 min

interface PageProps {
  params: Promise<{ locale: Locale; symbol: string }>;
}

function tierFromRank(rank: number | null): Tier | null {
  if (rank === null) return null;
  if (rank <= 20) return 'S';
  if (rank <= 100) return 'A';
  if (rank <= 500) return 'B';
  if (rank <= 2000) return 'C';
  if (rank <= 5000) return 'D';
  return 'F';
}

export default async function CoinDetailPage({ params }: PageProps) {
  const { locale, symbol } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('coin');
  const tCommon = await getTranslations('common');
  const tTier = await getTranslations('tier');

  const detail = await getCoinDetail(symbol).catch(() => null);
  if (!detail) {
    notFound();
  }

  const price = detail.current_price ?? 0;
  const change24h = detail.price_change_percentage_24h;
  const change7d = detail.price_change_percentage_7d_in_currency;
  const tier = tierFromRank(detail.market_cap_rank ?? null);

  // localized description (fallback chain: locale → en)
  const description = detail.description?.[locale.split('-')[0]] || detail.description?.en || '';

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-4">
          {detail.image && (
            <Image src={detail.image} alt={detail.symbol} width={64} height={64} className="rounded-full" unoptimized />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{detail.name}</h1>
              <Badge variant="secondary" className="uppercase">{detail.symbol}</Badge>
              {detail.market_cap_rank && <Badge variant="outline">#{detail.market_cap_rank}</Badge>}
              <TierBadge tier={tier} size="md" />
            </div>
            <p className="text-xs text-muted-foreground">{t('tierExplanation')}</p>
          </div>
        </div>
        <div className="md:ml-auto text-right space-y-1">
          <div className="text-3xl font-bold num tabular-nums">{formatPrice(price)}</div>
          <div className={cn('text-sm font-medium num', changeColor(change24h))}>
            {formatPercent(change24h)} (24h)
          </div>
          {change7d != null && (
            <div className={cn('text-xs num', changeColor(change7d))}>
              {formatPercent(change7d)} (7d)
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Key metrics grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label={t('overview')} value={tCommon('siteName')} icon="—" />
        <MetricCard label="Market Cap" value={formatCompact(detail.market_cap)} />
        <MetricCard label={t('fullyDiluted') ?? 'FDV'} value={formatCompact(detail.fully_diluted_valuation)} />
        <MetricCard label="24h Vol" value={formatCompact(detail.total_volume)} />
        <MetricCard
          label="Circulating"
          value={formatSupply(detail.circulating_supply, detail.symbol.toUpperCase())}
        />
        <MetricCard
          label="Total Supply"
          value={formatSupply(detail.total_supply, detail.symbol.toUpperCase())}
        />
        <MetricCard
          label="Max Supply"
          value={detail.max_supply ? formatSupply(detail.max_supply, detail.symbol.toUpperCase()) : '∞'}
        />
        <MetricCard label="ATH" value={formatPrice(detail.ath)} />
      </section>

      {/* 2-column: Description + Links */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xl font-semibold">{t('overview')}</h2>
          {description ? (
            <div
              className="prose prose-invert max-w-none text-sm prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No description available.</p>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-2">
            <h3 className="font-semibold text-sm">Links</h3>
            <div className="space-y-2">
              {detail.links?.homepage?.[0] && (
                <LinkRow icon={<Globe className="h-4 w-4" />} label="Website" href={detail.links.homepage[0]} />
              )}
              {detail.links?.whitepaper && (
                <LinkRow icon={<FileText className="h-4 w-4" />} label="Whitepaper" href={detail.links.whitepaper} />
              )}
              {detail.links?.repos_url?.github?.[0] && (
                <LinkRow icon={<Github className="h-4 w-4" />} label="GitHub" href={detail.links.repos_url.github[0]} />
              )}
              {detail.links?.twitter_screen_name && (
                <LinkRow
                  icon={<Twitter className="h-4 w-4" />}
                  label="Twitter"
                  href={`https://twitter.com/${detail.links.twitter_screen_name}`}
                />
              )}
              {detail.links?.telegram_channel_identifier && (
                <LinkRow
                  icon={<Send className="h-4 w-4" />}
                  label="Telegram"
                  href={`https://t.me/${detail.links.telegram_channel_identifier}`}
                />
              )}
              {detail.links?.subreddit_url && (
                <LinkRow icon={<MessageCircle className="h-4 w-4" />} label="Reddit" href={detail.links.subreddit_url} />
              )}
            </div>
          </div>

          {/* Buy CTA — アフィリ動線 */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h3 className="font-semibold text-sm">{tCommon('subscribe')}</h3>
            <div className="space-y-2">
              <Button asChild className="w-full" size="sm">
                <a href="https://bingx.com" target="_blank" rel="noopener noreferrer">
                  {t('buyOn', { exchange: 'BingX' })}
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full" size="sm">
                <a href="https://mexc.com" target="_blank" rel="noopener noreferrer">
                  {t('buyOn', { exchange: 'MEXC' })}
                </a>
              </Button>
            </div>
          </div>

          {/* Tier breakdown */}
          <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <TierBadge tier={tier} size="sm" />
              {tTier('explained')}
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>· {tTier('factors.liquidity')}</li>
              <li>· {tTier('factors.team')}</li>
              <li>· {tTier('factors.technology')}</li>
              <li>· {tTier('factors.community')}</li>
              <li>· {tTier('factors.regulatory')}</li>
              <li>· {tTier('factors.future')}</li>
            </ul>
            <p className="text-[10px] text-muted-foreground/70 pt-2">
              {/* TODO(tier-eval): 実際のスコア breakdown は tier_evaluations テーブルから表示 */}
              AI evaluation coming soon.
            </p>
          </div>
        </aside>
      </section>

      {/* TODO セクション — M1 で実装予定 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PlaceholderCard title={t('vcInvestors')} />
        <PlaceholderCard title={t('tokenUnlocks')} />
        <PlaceholderCard title={t('exchanges')} />
      </section>

      <p className="text-xs text-muted-foreground pt-4">
        Data: CoinGecko. Tier scoring by Cointier AI (DeepSeek V4 Pro via OpenRouter).{' '}
        <Link href="/" className="text-primary hover:underline">Back to home</Link>
      </p>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="num font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function LinkRow({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function PlaceholderCard({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-2">
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">Coming in M1 (requires CryptoRank Basic + RootData).</p>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, symbol } = await params;
  const detail = await getCoinDetail(symbol).catch(() => null);
  if (!detail) return { title: 'Not found' };
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: `${detail.name} (${detail.symbol.toUpperCase()})`,
    description: `${detail.name} — ${t('description')}`,
  };
}
