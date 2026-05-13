/**
 * /exchanges — CEX + Derivatives exchanges ranking.
 * Pulls CoinGecko /exchanges and /derivatives/exchanges in parallel.
 */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Building2, TrendingUp } from 'lucide-react';
import { getExchanges, getDerivativeExchanges } from '@/lib/api/coingecko';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatCompact } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 1800;

export default async function ExchangesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  await getTranslations({ locale });

  const [spot, derivatives] = await Promise.all([
    getExchanges(1, 100).catch(() => []),
    getDerivativeExchanges().catch(() => []),
  ]);

  const btcPriceProxy = 1; // values come BTC-denominated; volume is btc * (btc usd)
  // CoinGecko returns volume in BTC; we leave as BTC and let UI label "BTC".

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? '取引所ランキング' : 'Exchange rankings'}
        subtitle={`${spot.length} CEX + ${derivatives.length} derivatives`}
        meta={<PageBadge>CoinGecko</PageBadge>}
      />
      <Tabs defaultValue="spot">
        <TabsList>
          <TabsTrigger value="spot">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            Spot CEX ({spot.length})
          </TabsTrigger>
          <TabsTrigger value="derivatives">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            Derivatives ({derivatives.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spot">
          <div className="surface p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Trust score</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Established</TableHead>
                  <TableHead className="text-right">24h Vol (BTC)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spot.map((e, i) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground text-[10px] tabular-nums">{e.trust_score_rank ?? i + 1}</TableCell>
                    <TableCell>
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary">
                        <Image src={e.image} alt={e.name} width={20} height={20} className="rounded-full" unoptimized />
                        <span className="font-medium">{e.name}</span>
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block h-2 w-12 rounded-full ${
                        (e.trust_score ?? 0) >= 9 ? 'bg-gain' : (e.trust_score ?? 0) >= 7 ? 'bg-tier-a' : (e.trust_score ?? 0) >= 5 ? 'bg-tier-d' : 'bg-loss'
                      }`} />
                      <span className="text-[10px] text-muted-foreground ml-2 tabular-nums">{e.trust_score ?? '—'}/10</span>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{e.country ?? '—'}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground tabular-nums">{e.year_established ?? '—'}</TableCell>
                    <TableCell className="text-right num tabular-nums">{formatCompact(e.trade_volume_24h_btc_normalized)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="derivatives">
          <div className="surface p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">OI (BTC)</TableHead>
                  <TableHead className="text-right">24h Vol (BTC)</TableHead>
                  <TableHead className="text-right">Pairs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {derivatives.map((e, i) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                    <TableCell>
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary">
                        <Image src={e.image} alt={e.name} width={20} height={20} className="rounded-full" unoptimized />
                        <span className="font-medium">{e.name}</span>
                      </a>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{e.country ?? '—'}</TableCell>
                    <TableCell className="text-right num tabular-nums">{formatCompact(e.open_interest_btc)}</TableCell>
                    <TableCell className="text-right num tabular-nums">{formatCompact(Number(e.trade_volume_24h_btc))}</TableCell>
                    <TableCell className="text-right num tabular-nums">{e.number_of_perpetual_pairs + e.number_of_futures_pairs}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === 'ja' ? '取引所ランキング | Cointier' : 'Exchange rankings | Cointier' };
}
