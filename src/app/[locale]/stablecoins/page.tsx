/**
 * /stablecoins — supply tracker + depeg watch.
 */
import { setRequestLocale } from 'next-intl/server';
import { getStablecoinAssets } from '@/lib/db/ssot-queries';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCompact, formatPercent, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export default async function StablecoinsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const peggedAssets = await getStablecoinAssets(100);
  const totalSupply = peggedAssets.reduce((s, p) => s + (p.circulating_usd ?? 0), 0);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'ステーブルコイン市場' : 'Stablecoin market'}
        subtitle={`${peggedAssets.length} assets · $${formatCompact(totalSupply)} total supply`}
        meta={<PageBadge>DeFiLlama</PageBadge>}
      />
      <div className="surface p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Stablecoin</TableHead>
              <TableHead>Mechanism</TableHead>
              <TableHead className="text-right">Supply</TableHead>
              <TableHead className="text-right">1d</TableHead>
              <TableHead className="text-right">7d</TableHead>
              <TableHead className="text-right">30d</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peggedAssets.slice(0, 100).map((s, i) => {
              const supply = s.circulating_usd ?? 0;
              const prev1d = s.circulating_prev_day_usd ?? supply;
              const prev7d = s.circulating_prev_week_usd ?? supply;
              const prev30d = s.circulating_prev_month_usd ?? supply;
              const ch1 = prev1d > 0 ? ((supply - prev1d) / prev1d) * 100 : 0;
              const ch7 = prev7d > 0 ? ((supply - prev7d) / prev7d) * 100 : 0;
              const ch30 = prev30d > 0 ? ((supply - prev30d) / prev30d) * 100 : 0;
              const depeg = s.price != null && Math.abs(s.price - 1) > 0.005;
              return (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                  <TableCell>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase ml-2">{s.symbol}</span>
                  </TableCell>
                  <TableCell className="text-[11px] capitalize text-muted-foreground">{s.peg_mechanism}</TableCell>
                  <TableCell className="text-right num tabular-nums">${formatCompact(supply)}</TableCell>
                  <TableCell className={cn('text-right num tabular-nums text-[11px]', ch1 >= 0 ? 'text-gain' : 'text-loss')}>
                    {ch1 >= 0 ? '+' : ''}{formatPercent(ch1, 2)}
                  </TableCell>
                  <TableCell className={cn('text-right num tabular-nums text-[11px]', ch7 >= 0 ? 'text-gain' : 'text-loss')}>
                    {ch7 >= 0 ? '+' : ''}{formatPercent(ch7, 2)}
                  </TableCell>
                  <TableCell className={cn('text-right num tabular-nums text-[11px]', ch30 >= 0 ? 'text-gain' : 'text-loss')}>
                    {ch30 >= 0 ? '+' : ''}{formatPercent(ch30, 2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {depeg ? (
                      <Badge className="bg-loss/10 text-loss border-loss/30 text-[9px]">
                        ${s.price!.toFixed(4)} ⚠
                      </Badge>
                    ) : (
                      <span className="num tabular-nums text-[11px]">${s.price?.toFixed(4) ?? '1.0000'}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Stablecoins | Cointier' };
}
