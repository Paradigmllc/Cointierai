/**
 * /bridges — cross-chain bridge volume rankings (DeFiLlama bridges API).
 */
import { setRequestLocale } from 'next-intl/server';
import { getBridges } from '@/lib/api/defillama';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCompact, formatPercent, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

export default async function BridgesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const { bridges = [], chains = [] } = await getBridges().catch(() => ({ bridges: [], chains: [] }));
  const totalVol = bridges.reduce((s, b) => s + b.volumePrevDay, 0);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'ブリッジボリューム' : 'Cross-chain bridges'}
        subtitle={`${bridges.length} bridges · $${formatCompact(totalVol)} 24h volume`}
        meta={<PageBadge>DeFiLlama</PageBadge>}
      />

      <div className="surface p-5 space-y-3">
        <h2 className="section-heading">Top bridges (24h volume)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Bridge</TableHead>
              <TableHead>Chains</TableHead>
              <TableHead className="text-right">24h Volume</TableHead>
              <TableHead className="text-right">24h Δ</TableHead>
              <TableHead className="text-right">24h Txs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bridges.sort((a, b) => b.volumePrevDay - a.volumePrevDay).slice(0, 50).map((b, i) => {
              const change = b.volumePrev2Day > 0 ? ((b.volumePrevDay - b.volumePrev2Day) / b.volumePrev2Day) * 100 : 0;
              return (
                <TableRow key={b.id}>
                  <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                  <TableCell className="font-medium">{b.displayName}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">
                    {b.chains.slice(0, 3).map((c) => (
                      <Badge key={c} variant="secondary" className="mr-1 text-[9px]">{c}</Badge>
                    ))}
                    {b.chains.length > 3 && <span>+{b.chains.length - 3}</span>}
                  </TableCell>
                  <TableCell className="text-right num tabular-nums">${formatCompact(b.volumePrevDay)}</TableCell>
                  <TableCell className={cn('text-right num tabular-nums text-[11px]', change >= 0 ? 'text-gain' : 'text-loss')}>
                    {change >= 0 ? '+' : ''}{formatPercent(change, 1)}
                  </TableCell>
                  <TableCell className="text-right num tabular-nums">{formatCompact(b.txsPrevDay)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {chains.length > 0 && (
        <div className="surface p-5 space-y-3">
          <h2 className="section-heading">Top destination chains</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chain</TableHead>
                <TableHead className="text-right">24h Volume</TableHead>
                <TableHead className="text-right">24h Txs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chains.sort((a, b) => b.volumePrevDay - a.volumePrevDay).slice(0, 20).map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium capitalize">{c.name}</TableCell>
                  <TableCell className="text-right num tabular-nums">${formatCompact(c.volumePrevDay)}</TableCell>
                  <TableCell className="text-right num tabular-nums">{formatCompact(c.totalTxs)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Bridges | Cointier' };
}
