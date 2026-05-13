/**
 * /funds — Crypto VC funds ranking.
 * Aggregates DefiLlama Raises by investor and surfaces deal counts.
 */
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Briefcase, Globe } from 'lucide-react';
import { getRaises } from '@/lib/api/defillama';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCompact } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 86_400;

const ASIA_VC = new Set(['animoca', 'hashkey', 'foresight', 'sino', 'jump', 'iosg', 'sky9', 'youbi', 'mirana', 'mh ventures', 'spartan']);

export default async function FundsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const { raises = [] } = await getRaises().catch(() => ({ raises: [] }));

  // Aggregate by investor across all rounds.
  const map = new Map<string, { name: string; deals: number; totalUsd: number; lead: number; sectors: Set<string>; latestDate: number }>();
  for (const r of raises) {
    for (const inv of [...r.leadInvestors, ...r.otherInvestors]) {
      if (!inv) continue;
      const entry = map.get(inv) ?? { name: inv, deals: 0, totalUsd: 0, lead: 0, sectors: new Set<string>(), latestDate: 0 };
      entry.deals += 1;
      if (r.leadInvestors.includes(inv)) entry.lead += 1;
      entry.totalUsd += r.amount ?? 0;
      if (r.sector) entry.sectors.add(r.sector);
      entry.latestDate = Math.max(entry.latestDate, r.date);
      map.set(inv, entry);
    }
  }
  const ranked = [...map.values()].sort((a, b) => b.deals - a.deals).slice(0, 200);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? '暗号資産 VC ファンド' : 'Crypto VC funds'}
        subtitle={`${ranked.length} funds · ${raises.length} tracked rounds`}
        meta={<PageBadge>DeFiLlama Raises</PageBadge>}
      />
      <div className="surface p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Fund</TableHead>
              <TableHead className="text-right">Deals</TableHead>
              <TableHead className="text-right">Lead</TableHead>
              <TableHead className="text-right">Total raised</TableHead>
              <TableHead>Focus</TableHead>
              <TableHead className="text-right">Latest deal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((v, i) => {
              const asia = ASIA_VC.has(v.name.toLowerCase().split(' ')[0]);
              return (
                <TableRow key={v.name}>
                  <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                  <TableCell>
                    <Link href={`/vc/${encodeURIComponent(v.name)}`} className="hover:text-primary font-medium inline-flex items-center gap-2">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      {v.name}
                      {asia && <Badge className="text-[9px] bg-tier-s/10 text-tier-s border-tier-s/30">Asia</Badge>}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right num tabular-nums">{v.deals}</TableCell>
                  <TableCell className="text-right num tabular-nums text-[11px] text-muted-foreground">{v.lead}</TableCell>
                  <TableCell className="text-right num tabular-nums">${formatCompact(v.totalUsd)}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">
                    {[...v.sectors].slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="mr-1 text-[9px]">{s}</Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground tabular-nums">
                    {v.latestDate ? new Date(v.latestDate * 1000).toISOString().slice(0, 10) : '—'}
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
  return { title: 'Crypto VC Funds | Cointier' };
}
