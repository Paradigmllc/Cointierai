/**
 * /sectors — categories index (CoinGecko + DeFiLlama categories).
 */
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getCategories } from '@/lib/api/coingecko';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatCompact, formatPercent, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export default async function SectorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const cats = await getCategories().catch(() => []);
  const sorted = cats.sort((a, b) => b.market_cap - a.market_cap);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'セクター・カテゴリ' : 'Sectors & categories'}
        subtitle={`${sorted.length} sectors ranked by market cap`}
        meta={<PageBadge>CoinGecko</PageBadge>}
      />
      <div className="surface p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead className="text-right">Market cap</TableHead>
              <TableHead className="text-right">24h Δ</TableHead>
              <TableHead>Top 3 coins</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                <TableCell>
                  <Link href={`/category/${c.id}`} className="hover:text-primary font-medium">{c.name}</Link>
                </TableCell>
                <TableCell className="text-right num tabular-nums">${formatCompact(c.market_cap)}</TableCell>
                <TableCell className={cn('text-right num tabular-nums text-[11px]', c.market_cap_change_24h >= 0 ? 'text-gain' : 'text-loss')}>
                  {c.market_cap_change_24h >= 0 ? '+' : ''}{formatPercent(c.market_cap_change_24h, 2)}
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{c.top_3_coins.length} coins</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Sectors | Cointier' };
}
