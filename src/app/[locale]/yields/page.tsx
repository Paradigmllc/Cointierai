/**
 * /yields — DeFi yield opportunities (DeFiLlama yields.llama.fi).
 */
import { setRequestLocale } from 'next-intl/server';
import { TrendingUp } from 'lucide-react';
import { getYieldPools } from '@/lib/api/defillama';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCompact, formatPercent } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

interface Pool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number | null;
  apyReward?: number | null;
  stablecoin: boolean;
  ilRisk: 'no' | 'yes';
  exposure: 'single' | 'multi';
}

export default async function YieldsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const { data: pools = [] } = await getYieldPools().catch(() => ({ data: [] as unknown[] }));
  const rows = (pools as unknown as Pool[])
    .filter((p) => p.tvlUsd > 100_000 && p.apy > 0 && p.apy < 1_000)
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, 200);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'イールド機会' : 'Yield opportunities'}
        subtitle={`${rows.length} pools · TVL>$100K · APY <1,000%`}
        meta={<PageBadge>DeFiLlama</PageBadge>}
      />
      <div className="surface p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Pool</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead className="text-right">TVL</TableHead>
              <TableHead className="text-right">APY</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p, i) => (
              <TableRow key={p.pool}>
                <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                <TableCell className="font-medium capitalize">{p.project}</TableCell>
                <TableCell className="text-[11px]">
                  <span className="font-medium">{p.symbol}</span>
                  {p.stablecoin && <Badge variant="secondary" className="ml-2 text-[9px]">Stable</Badge>}
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground capitalize">{p.chain}</TableCell>
                <TableCell className="text-right num tabular-nums">${formatCompact(p.tvlUsd)}</TableCell>
                <TableCell className="text-right num tabular-nums text-gain font-semibold">{formatPercent(p.apy, 2)}</TableCell>
                <TableCell>
                  {p.ilRisk === 'yes' ? (
                    <Badge className="bg-loss/10 text-loss border-loss/30 text-[9px]">IL risk</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px]">Low IL</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Yield opportunities | Cointier' };
}
