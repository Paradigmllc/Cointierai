/**
 * /unlocks-calendar — market-wide token unlock calendar (DeFiLlama emissions).
 */
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Calendar, AlertTriangle } from 'lucide-react';
import { getUnlocks } from '@/lib/api/defillama';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCompact, formatPercent, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;
export const dynamic = "force-dynamic";

interface EmissionEntry {
  symbol: string;
  name: string;
  gecko_id: string | null;
  mcap: number | null;
  tokenPrice: number | null;
  nextEvent: { date: number; toUnlock: number; description: string | null } | null;
}

export default async function UnlocksCalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const data = (await getUnlocks().catch(() => [])) as EmissionEntry[];
  const now = Date.now() / 1000;
  const upcoming = data
    .filter((e) => e.nextEvent && e.nextEvent.date > now)
    .sort((a, b) => (a.nextEvent!.date - b.nextEvent!.date))
    .slice(0, 200);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'トークンアンロックカレンダー' : 'Token unlock calendar'}
        subtitle={`${upcoming.length} upcoming unlocks across all tracked tokens`}
        meta={<PageBadge>DeFiLlama</PageBadge>}
      />
      <div className="surface p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead className="text-right">Unlock value</TableHead>
              <TableHead className="text-right">% MCap</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcoming.map((e) => {
              const days = Math.round((e.nextEvent!.date - now) / 86_400);
              const unlockUsd = e.nextEvent!.toUnlock * (e.tokenPrice ?? 0);
              const pctMcap = e.mcap && unlockUsd ? (unlockUsd / e.mcap) * 100 : null;
              const heavy = pctMcap != null && pctMcap > 5;
              return (
                <TableRow key={`${e.symbol}-${e.nextEvent!.date}`}>
                  <TableCell className="tabular-nums text-[11px]">
                    <div>{new Date(e.nextEvent!.date * 1000).toISOString().slice(0, 10)}</div>
                    <div className="text-muted-foreground text-[10px]">in {days}d</div>
                  </TableCell>
                  <TableCell>
                    {e.gecko_id ? (
                      <Link href={`/coin/${e.gecko_id}`} className="hover:text-primary font-medium">
                        {e.name} <span className="text-[10px] text-muted-foreground uppercase">{e.symbol}</span>
                      </Link>
                    ) : (
                      <span className="font-medium">{e.name} <span className="text-[10px] text-muted-foreground uppercase">{e.symbol}</span></span>
                    )}
                  </TableCell>
                  <TableCell className="text-right num tabular-nums">${formatCompact(unlockUsd)}</TableCell>
                  <TableCell className="text-right num tabular-nums">
                    {pctMcap != null ? (
                      <span className={cn(heavy ? 'text-loss font-semibold' : '')}>
                        {heavy && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                        {formatPercent(pctMcap, 2)}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground max-w-xs truncate">{e.nextEvent!.description ?? '—'}</TableCell>
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
  return { title: 'Token unlock calendar | Cointier' };
}
