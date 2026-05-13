/**
 * /status — operational dashboard for ingest freshness.
 *
 * Lists each SSOT table with row count + most recent `fetched_at` /
 * `snapshot_at` / `generated_at`. Anyone hitting cointier.ai/status can
 * tell at a glance whether the data backbone is alive.
 *
 * Public on purpose — Cointier wants the "ingest just ran 3 min ago"
 * cue to be visible from outside, like https://status.openai.com.
 */
import { setRequestLocale } from 'next-intl/server';
import { Activity } from 'lucide-react';
import { createServiceSupabase } from '@/lib/db/supabase';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { FreshnessBadge } from '@/components/ui/freshness-badge';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

interface TableStatus {
  table: string;
  freshnessColumn: string;
  rows: number;
  newest: string | null;
}

const TABLES: Array<{ table: string; freshnessColumn: string }> = [
  { table: 'coins', freshnessColumn: 'updated_at' },
  { table: 'dex_pairs', freshnessColumn: 'fetched_at' },
  { table: 'news_articles', freshnessColumn: 'fetched_at' },
  { table: 'derivatives_snapshots', freshnessColumn: 'snapshot_at' },
  { table: 'holders_snapshots', freshnessColumn: 'snapshot_at' },
  { table: 'developer_stats', freshnessColumn: 'fetched_at' },
  { table: 'community_stats', freshnessColumn: 'fetched_at' },
  { table: 'onchain_metrics', freshnessColumn: 'fetched_at' },
  { table: 'team_profiles', freshnessColumn: 'fetched_at' },
  { table: 'yields_pools', freshnessColumn: 'fetched_at' },
  { table: 'stablecoin_assets', freshnessColumn: 'fetched_at' },
  { table: 'bridges', freshnessColumn: 'fetched_at' },
  { table: 'exchanges_index', freshnessColumn: 'fetched_at' },
  { table: 'dex_rankings', freshnessColumn: 'fetched_at' },
  { table: 'compare_articles', freshnessColumn: 'generated_at' },
  { table: 'coin_verdicts', freshnessColumn: 'generated_at' },
];

export default async function StatusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  const supabase = createServiceSupabase();

  const out: TableStatus[] = [];
  await Promise.all(
    TABLES.map(async (t) => {
      try {
        const { count } = await supabase.from(t.table).select('*', { count: 'exact', head: true });
        const { data } = await supabase
          .from(t.table)
          .select(t.freshnessColumn)
          .order(t.freshnessColumn, { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();
        const newest = (data as Record<string, string> | null)?.[t.freshnessColumn] ?? null;
        out.push({ table: t.table, freshnessColumn: t.freshnessColumn, rows: count ?? 0, newest });
      } catch (e) {
        out.push({ table: t.table, freshnessColumn: t.freshnessColumn, rows: -1, newest: null });
        console.error(`[status] ${t.table}`, e);
      }
    }),
  );
  // Preserve declared order
  out.sort((a, b) => TABLES.findIndex((t) => t.table === a.table) - TABLES.findIndex((t) => t.table === b.table));

  const totalRows = out.reduce((s, r) => s + (r.rows > 0 ? r.rows : 0), 0);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'システムステータス' : 'System status'}
        subtitle={`${out.length} SSOT tables · ${totalRows.toLocaleString()} total rows`}
        meta={<PageBadge><Activity className="h-3 w-3 mr-1" />SSOT health</PageBadge>}
      />
      <section className="surface p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead className="text-right">Rows</TableHead>
              <TableHead>Latest entry</TableHead>
              <TableHead className="text-right">Health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {out.map((r) => {
              const ageMs = r.newest ? Date.now() - new Date(r.newest).getTime() : Infinity;
              const minutesOld = ageMs / 60_000;
              const health = r.rows === 0
                ? 'empty'
                : minutesOld < 30 ? 'fresh'
                : minutesOld < 60 * 6 ? 'recent'
                : minutesOld < 60 * 24 ? 'stale'
                : 'old';
              const healthColor = {
                empty: 'bg-muted-foreground/30',
                fresh: 'bg-gain',
                recent: 'bg-tier-a',
                stale: 'bg-tier-d',
                old: 'bg-loss',
              }[health];
              return (
                <TableRow key={r.table}>
                  <TableCell className="font-mono text-[11px]">cointier.{r.table}</TableCell>
                  <TableCell className="text-right num tabular-nums">{r.rows >= 0 ? r.rows.toLocaleString() : 'err'}</TableCell>
                  <TableCell>
                    <FreshnessBadge iso={r.newest} variant="dot" />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn('inline-block h-2 w-12 rounded-full', healthColor)} title={health} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
      <p className="text-[10px] text-muted-foreground/70">
        {locale === 'ja'
          ? '緑 = 30分以内 / 銀 = 6時間以内 / 橙 = 24時間以内 / 赤 = 24時間以上 / 灰 = 未取込'
          : 'Green ≤ 30 min · Silver ≤ 6 h · Orange ≤ 24 h · Red > 24 h · Gray = empty'}
      </p>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'System Status | Cointier' };
}
