/**
 * /hyperliquid — Cointier's Hyperliquid hub.
 *
 * Sections:
 *   1. Market overview (universe + funding rates + OI)
 *   2. Smart Trader leaderboard (top PnL traders)
 *   3. Builder Fee earnings (current user)
 *   4. Import trade history (call-to-action)
 */
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Zap, Crown, Trophy, ArrowUpRight } from 'lucide-react';
import { getMetaAndCtxs, getLeaderboard } from '@/lib/api/hyperliquid';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCompact, formatPercent, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 600;

export default async function HyperliquidPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const [metaCtx, leaderboardResp] = await Promise.all([
    getMetaAndCtxs().catch(() => null),
    getLeaderboard().catch(() => ({ leaderboardRows: [] })),
  ]);

  const universe = metaCtx?.[0]?.universe ?? [];
  const ctxs = metaCtx?.[1] ?? [];
  const markets = universe.map((u, i) => ({ ...u, ctx: ctxs[i] })).filter((m) => m.ctx).slice(0, 50);

  const top = leaderboardResp.leaderboardRows
    .filter((r) => r.windowPerformances.length > 0)
    .map((r) => {
      const month = r.windowPerformances.find(([k]) => k === 'month')?.[1];
      const allTime = r.windowPerformances.find(([k]) => k === 'allTime')?.[1];
      return {
        address: r.ethAddress,
        name: r.displayName,
        equity: Number(r.accountValue),
        monthPnl: month ? Number(month.pnl) : 0,
        monthRoi: month ? Number(month.roi) * 100 : 0,
        allTimePnl: allTime ? Number(allTime.pnl) : 0,
      };
    })
    .sort((a, b) => b.monthPnl - a.monthPnl)
    .slice(0, 50);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title="Hyperliquid Hub"
        subtitle={locale === 'ja' ? 'Cointier 経由で取引すると 0.05% の Builder Fee がオンチェーンで永続的に還元されます' : 'Trade via Cointier and earn permanent on-chain 0.05% Builder Fee rebates'}
        meta={<PageBadge>Hyperliquid · Cointier Builder</PageBadge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface p-5 space-y-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" /> {locale === 'ja' ? '上場銘柄' : 'Listed perps'}
          </div>
          <div className="text-3xl font-bold tabular-nums">{universe.length}</div>
          <div className="text-[11px] text-muted-foreground">{markets.filter((m) => m.maxLeverage >= 20).length} with 20×+ leverage</div>
        </div>
        <div className="surface p-5 space-y-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Trophy className="h-3 w-3 text-tier-s" /> Top trader 30d PnL
          </div>
          <div className="text-3xl font-bold tabular-nums text-gain">
            ${top.length ? formatCompact(top[0].monthPnl) : '—'}
          </div>
          <div className="text-[11px] text-muted-foreground">across {top.length} active traders</div>
        </div>
        <div className="surface p-5 space-y-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Crown className="h-3 w-3 text-tier-a" /> Builder Fee
          </div>
          <Link href="/dashboard/builder-fee" className="inline-flex items-center gap-1 text-2xl font-bold text-primary hover:underline">
            View earnings <ArrowUpRight className="h-5 w-5" />
          </Link>
          <div className="text-[11px] text-muted-foreground">{locale === 'ja' ? 'ウォレット接続で開始' : 'Connect wallet to start earning'}</div>
        </div>
      </div>

      <section className="surface p-5 space-y-3">
        <h2 className="section-heading flex items-center gap-2"><Crown className="h-4 w-4 text-tier-s" />Smart Trader Leaderboard · 30d PnL</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Trader</TableHead>
              <TableHead className="text-right">Equity</TableHead>
              <TableHead className="text-right">30d PnL</TableHead>
              <TableHead className="text-right">30d ROI</TableHead>
              <TableHead className="text-right">All-time PnL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {top.slice(0, 30).map((t, i) => (
              <TableRow key={t.address}>
                <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                <TableCell>
                  <a href={`https://app.hyperliquid.xyz/explorer/address/${t.address}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                    {t.name ?? `${t.address.slice(0, 6)}…${t.address.slice(-4)}`}
                    <ArrowUpRight className="h-3 w-3 opacity-50" />
                  </a>
                </TableCell>
                <TableCell className="text-right num tabular-nums">${formatCompact(t.equity)}</TableCell>
                <TableCell className={cn('text-right num tabular-nums font-semibold', t.monthPnl >= 0 ? 'text-gain' : 'text-loss')}>
                  {t.monthPnl >= 0 ? '+' : ''}${formatCompact(Math.abs(t.monthPnl))}
                </TableCell>
                <TableCell className={cn('text-right num tabular-nums', t.monthRoi >= 0 ? 'text-gain' : 'text-loss')}>
                  {formatPercent(t.monthRoi, 1)}
                </TableCell>
                <TableCell className={cn('text-right num tabular-nums', t.allTimePnl >= 0 ? 'text-gain' : 'text-loss')}>
                  ${formatCompact(Math.abs(t.allTimePnl))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="surface p-5 space-y-3">
        <h2 className="section-heading">{locale === 'ja' ? '銘柄一覧 (Funding × OI)' : 'Markets (Funding × OI)'}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Mark price</TableHead>
              <TableHead className="text-right">24h Δ</TableHead>
              <TableHead className="text-right">Funding (1h)</TableHead>
              <TableHead className="text-right">Open interest</TableHead>
              <TableHead className="text-right">Max lev</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {markets.slice(0, 30).map((m) => {
              const mark = Number(m.ctx!.markPx);
              const prev = Number(m.ctx!.prevDayPx);
              const change = prev > 0 ? ((mark - prev) / prev) * 100 : 0;
              const funding = Number(m.ctx!.funding) * 100;
              return (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">
                    <Link href={`/coin/${m.name.toLowerCase()}`} className="hover:text-primary">{m.name}</Link>
                  </TableCell>
                  <TableCell className="text-right num tabular-nums">${mark.toLocaleString(undefined, { maximumFractionDigits: 4 })}</TableCell>
                  <TableCell className={cn('text-right num tabular-nums text-[11px]', change >= 0 ? 'text-gain' : 'text-loss')}>
                    {change >= 0 ? '+' : ''}{formatPercent(change, 2)}
                  </TableCell>
                  <TableCell className={cn('text-right num tabular-nums text-[11px]', funding >= 0 ? 'text-gain' : 'text-loss')}>
                    {funding.toFixed(4)}%
                  </TableCell>
                  <TableCell className="text-right num tabular-nums">${formatCompact(Number(m.ctx!.openInterest) * mark)}</TableCell>
                  <TableCell className="text-right num tabular-nums">{m.maxLeverage}×</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Hyperliquid Hub | Cointier' };
}
