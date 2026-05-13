'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, useChartTheme, BarChart, Bar, ReferenceLine } from '@/components/ui/chart';
import { formatCompact, cn } from '@/lib/utils';
import type { DerivativesSnapshotRow } from '@/lib/db/ssot-queries';

export function DerivativesHistoryCharts({ history }: { history: DerivativesSnapshotRow[] }) {
  const theme = useChartTheme();
  const hasFunding = history.some((h) => h.funding_rate != null);
  const hasOi = history.some((h) => h.open_interest_usd != null);
  const hasLsr = history.some((h) => h.long_short_ratio != null);
  const hasLiq = history.some((h) => h.liquidations_24h_usd != null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hasFunding && (
        <ChartTile title="Funding rate (8h)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.map((h) => ({ t: h.snapshot_at, v: (h.funding_rate ?? 0) * 100 }))}>
              <XAxis dataKey="t" hide />
              <YAxis stroke={theme.axis} fontSize={9} tickFormatter={(v) => `${v.toFixed(3)}%`} width={48} />
              <ReferenceLine y={0} stroke={theme.axis} strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`${v.toFixed(4)}%`, '']}
              />
              <Line dataKey="v" type="monotone" stroke={theme.palette[0]} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartTile>
      )}

      {hasOi && (
        <ChartTile title="Open interest (USD)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.map((h) => ({ t: h.snapshot_at, v: h.open_interest_usd ?? 0 }))}>
              <XAxis dataKey="t" hide />
              <YAxis stroke={theme.axis} fontSize={9} tickFormatter={(v) => formatCompact(v)} width={48} />
              <Tooltip
                contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`$${formatCompact(v)}`, '']}
              />
              <Line dataKey="v" type="monotone" stroke={theme.palette[5]} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartTile>
      )}

      {hasLsr && (
        <ChartTile title="Long / Short ratio">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.map((h) => ({ t: h.snapshot_at, v: h.long_short_ratio ?? 1 }))}>
              <XAxis dataKey="t" hide />
              <YAxis stroke={theme.axis} fontSize={9} width={36} />
              <ReferenceLine y={1} stroke={theme.axis} strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [v.toFixed(3), '']}
              />
              <Line dataKey="v" type="monotone" stroke={theme.palette[1]} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartTile>
      )}

      {hasLiq && (
        <ChartTile title="Liquidations 24h">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history.slice(-24).map((h) => ({ t: h.snapshot_at, long: h.liquidations_long_usd ?? 0, short: h.liquidations_short_usd ?? 0 }))}>
              <XAxis dataKey="t" hide />
              <Tooltip
                contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
                formatter={(v: number, n: string) => [`$${formatCompact(v)}`, n === 'long' ? 'Long liq.' : 'Short liq.']}
              />
              <Bar dataKey="long" stackId="a" fill={theme.palette[1]} />
              <Bar dataKey="short" stackId="a" fill={theme.palette[2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartTile>
      )}
    </div>
  );
}

function ChartTile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-subtle p-3 space-y-2">
      <div className="text-[11px] font-medium text-muted-foreground">{title}</div>
      <div className="h-[140px]">{children}</div>
    </div>
  );
}
