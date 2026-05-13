/**
 * /tools/unlock-impact — supply-side pressure forecaster.
 *
 * Pulls upcoming unlock events for a coin (DeFiLlama /emissions) and shows
 * the value of tokens unlocking over the next 30/60/90 days vs daily volume.
 * "Heavy" warning when unlock value / 7d avg volume > 10% (suggests sell pressure).
 */
import { setRequestLocale } from 'next-intl/server';
import { Calendar, AlertTriangle, TrendingDown } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getUnlocks } from '@/lib/api/defillama';
import { formatCompact, formatPercent, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

interface EmissionEntry {
  symbol: string;
  name: string;
  gecko_id: string | null;
  mcap: number | null;
  tokenPrice: number | null;
  events: Array<{ description: string; noOfTokens: number[]; timestamp: number; category: string }>;
}

export default async function UnlockImpactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const data = (await getUnlocks().catch(() => [])) as EmissionEntry[];
  const now = Date.now() / 1000;
  const window30d = now + 30 * 86_400;

  // For each project, sum 30d unlock value, then sort desc.
  const rows = data
    .map((e) => {
      const upcoming = e.events.filter((ev) => ev.timestamp > now && ev.timestamp < window30d);
      const totalTokens = upcoming.reduce((s, ev) => s + (ev.noOfTokens?.reduce((a, b) => a + b, 0) ?? 0), 0);
      const unlockUsd = totalTokens * (e.tokenPrice ?? 0);
      const pctMcap = e.mcap && unlockUsd ? (unlockUsd / e.mcap) * 100 : null;
      return {
        symbol: e.symbol,
        name: e.name,
        gecko_id: e.gecko_id,
        mcap: e.mcap,
        unlockUsd,
        eventCount: upcoming.length,
        pctMcap,
      };
    })
    .filter((r) => r.unlockUsd > 0)
    .sort((a, b) => b.unlockUsd - a.unlockUsd)
    .slice(0, 80);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'アンロック影響試算' : 'Unlock impact forecast'}
        subtitle={locale === 'ja' ? '今後 30 日間に解放されるトークンの市場価値' : 'Value of tokens unlocking in the next 30 days'}
        meta={<PageBadge><Calendar className="h-3 w-3 mr-1" />30d forecast</PageBadge>}
      />
      <div className="surface p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Project</TableHead>
              <TableHead className="text-right">30d Unlock value</TableHead>
              <TableHead className="text-right">% Market cap</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead>Pressure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const heavy = r.pctMcap != null && r.pctMcap > 10;
              const medium = r.pctMcap != null && r.pctMcap > 3;
              return (
                <TableRow key={`${r.symbol}-${i}`}>
                  <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                  <TableCell>
                    {r.gecko_id ? (
                      <Link href={`/coin/${r.gecko_id}`} className="hover:text-primary font-medium">
                        {r.name} <span className="text-[10px] text-muted-foreground uppercase">{r.symbol}</span>
                      </Link>
                    ) : (
                      <span className="font-medium">{r.name} <span className="text-[10px] text-muted-foreground uppercase">{r.symbol}</span></span>
                    )}
                  </TableCell>
                  <TableCell className="text-right num tabular-nums">${formatCompact(r.unlockUsd)}</TableCell>
                  <TableCell className={cn('text-right num tabular-nums', heavy && 'text-loss font-semibold', medium && !heavy && 'text-tier-d')}>
                    {r.pctMcap != null ? formatPercent(r.pctMcap, 2) : '—'}
                  </TableCell>
                  <TableCell className="text-right num tabular-nums">{r.eventCount}</TableCell>
                  <TableCell>
                    {heavy ? (
                      <Badge className="bg-loss/10 text-loss border-loss/30 text-[9px]"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Heavy</Badge>
                    ) : medium ? (
                      <Badge className="bg-tier-d/10 text-tier-d border-tier-d/30 text-[9px]"><TrendingDown className="h-2.5 w-2.5 mr-0.5" />Medium</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px]">Low</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-[10px] text-muted-foreground/70 px-1">
        {locale === 'ja' ? '⚠️ アンロック値が時価総額の 10% を超える場合「Heavy」と判定。売り圧の参考指標です。' : '⚠️ Marked "Heavy" when unlock value exceeds 10% of market cap — a sell-pressure proxy.'}
      </p>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Unlock impact forecast | Cointier' };
}
