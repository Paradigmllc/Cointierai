'use client';

import { useEffect, useState } from 'react';
import { Zap, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, useChartTheme, BarChart, Bar, ReferenceLine } from '@/components/ui/chart';
import { formatCompact, formatPercent, cn } from '@/lib/utils';

interface Props {
  symbol: string;
  locale: 'ja' | 'en' | string;
}

interface DerivData {
  funding: Array<{ time: number; fundingRate: number }>;
  oi: Array<{ time: number; openInterest: number }>;
  longshort: Array<{ time: number; longShortRatio: number }>;
  liquidations: Array<{ exchangeName: string; longLiquidationUsd: number; shortLiquidationUsd: number }>;
}

export function DerivativesHistoryPanel({ symbol, locale }: Props) {
  const theme = useChartTheme();
  const [data, setData] = useState<DerivData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/derivatives?symbol=${symbol.toUpperCase()}`).catch(() => null);
      if (!res || !res.ok) {
        if (!cancelled) setData({ funding: [], oi: [], longshort: [], liquidations: [] });
        return;
      }
      const json = (await res.json()) as DerivData;
      if (!cancelled) setData(json);
    })();
    return () => { cancelled = true; };
  }, [symbol]);

  if (!data) return null;
  const hasAny = data.funding.length || data.oi.length || data.longshort.length || data.liquidations.length;
  if (!hasAny) return null;

  return (
    <section className="surface p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />{locale === 'ja' ? 'デリバティブ履歴' : 'Derivatives history'}</h2>
        <span className="text-[10px] text-muted-foreground">Coinglass · 7d</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.funding.length > 0 && (
          <ChartTile title="Funding rate (8h)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.funding.map((f) => ({ t: f.time, v: f.fundingRate * 100 }))}>
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

        {data.oi.length > 0 && (
          <ChartTile title="Open interest (USD)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.oi.map((o) => ({ t: o.time, v: o.openInterest }))}>
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

        {data.longshort.length > 0 && (
          <ChartTile title="Long / Short ratio">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.longshort.map((l) => ({ t: l.time, v: l.longShortRatio }))}>
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

        {data.liquidations.length > 0 && (
          <ChartTile title="24h liquidations by exchange" icon={<AlertTriangle className="h-3 w-3 text-loss" />}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.liquidations.slice(0, 8).map((l) => ({ name: l.exchangeName, long: l.longLiquidationUsd, short: l.shortLiquidationUsd }))}>
                <XAxis dataKey="name" stroke={theme.axis} fontSize={9} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
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
    </section>
  );
}

function ChartTile({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-subtle p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="h-[140px]">{children}</div>
    </div>
  );
}
