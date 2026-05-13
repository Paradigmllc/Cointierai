'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { BarChart3, ExternalLink, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LlamaProtocolDetail } from '@/lib/api/defillama';
import { formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';

interface DefiLlamaPanelViewProps {
  detail: LlamaProtocolDetail;
  slug: string;
  currentTvlUsd?: number | null;
  change1d?: number | null;
  change7d?: number | null;
  category?: string | null;
  locale: string;
}

/**
 * Pure client view that renders Recharts visuals from a pre-fetched
 * `LlamaProtocolDetail`. Recharts pulls in class-based components that
 * fail Next.js' "collect page data" pass when rendered from an async
 * server component, so the data fetch lives in the parent server file
 * and only the chart layer is hydrated here.
 */
export function DefiLlamaPanelView({
  detail,
  slug,
  currentTvlUsd,
  change1d,
  change7d,
  category,
  locale,
}: DefiLlamaPanelViewProps) {
  if (!detail || !Array.isArray(detail.tvl)) return null;

  const cutoff = Date.now() / 1000 - 90 * 86_400;
  const tvlSeries = detail.tvl
    .filter((p) => p.date >= cutoff && Number.isFinite(p.totalLiquidityUSD))
    .map((p) => ({ ts: p.date, date: new Date(p.date * 1000).toISOString().slice(5, 10), tvl: p.totalLiquidityUSD }));

  const chainTvls = Object.entries(detail.chainTvls ?? {})
    .filter(([k]) => !k.includes('-'))
    .map(([chain, v]) => {
      const last = v.tvl[v.tvl.length - 1];
      return { chain, tvl: last?.totalLiquidityUSD ?? 0 };
    })
    .filter((x) => x.tvl > 0)
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, 7);

  const change30d = (() => {
    if (tvlSeries.length < 2) return null;
    const last = tvlSeries[tvlSeries.length - 1].tvl;
    const ago = tvlSeries[0].tvl;
    if (!ago) return null;
    return ((last - ago) / ago) * 100;
  })();

  const isJa = locale === 'ja';
  const peakTvl = tvlSeries.reduce((m, p) => Math.max(m, p.tvl), 0);
  const tvlNow = currentTvlUsd ?? tvlSeries[tvlSeries.length - 1]?.tvl ?? 0;

  return (
    <section className="surface p-5 space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h2 className="section-heading flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            DeFiLlama — {detail.name ?? slug}
            <Badge variant="outline" className="text-[9px] py-0">Live</Badge>
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            {category ?? detail.category ? <Badge variant="secondary" className="text-[10px] py-0">{category ?? detail.category}</Badge> : null}
            {detail.chains?.slice(0, 4).map((c) => (
              <Badge key={c} variant="outline" className="text-[10px] py-0">{c}</Badge>
            ))}
            {detail.audits === '2' && <Badge variant="outline" className="text-[10px] py-0 text-gain border-gain/40">Audited</Badge>}
            {detail.audit_links?.[0] && (
              <a href={detail.audit_links[0]} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
                Audit <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 text-right">
          <Kpi label="TVL" value={formatCompact(tvlNow)} sub={isJa ? '現在' : 'now'} />
          <Kpi label="1d" value={formatPercent(change1d, 2)} valueClass={changeColor(change1d)} />
          <Kpi label="7d" value={formatPercent(change7d, 2)} valueClass={changeColor(change7d)} />
          <Kpi label="30d" value={formatPercent(change30d, 2)} valueClass={changeColor(change30d)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[12px] font-medium text-muted-foreground">{isJa ? 'TVL 推移 (90 日)' : 'TVL trend (90d)'}</h3>
          {peakTvl > 0 && (
            <span className="text-[10px] text-muted-foreground">{isJa ? 'ピーク' : 'Peak'}: {formatCompact(peakTvl)}</span>
          )}
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tvlSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(99,91,255,0.4)" />
                  <stop offset="100%" stopColor="rgba(99,91,255,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor' }} stroke="currentColor" className="text-muted-foreground" />
              <YAxis
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickFormatter={(v: number) => formatCompact(v)}
                stroke="currentColor"
                className="text-muted-foreground"
                width={55}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof tvlSeries)[number];
                  return (
                    <div className="rounded-md border border-border bg-popover shadow-card p-2 text-[11px] space-y-0.5">
                      <div className="font-semibold">{new Date(p.ts * 1000).toISOString().slice(0, 10)}</div>
                      <div className="num tabular-nums">{formatCompact(p.tvl)}</div>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="tvl" stroke="rgba(99,91,255,0.9)" strokeWidth={1.6} fill="url(#tvlGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {chainTvls.length > 0 && (
        <div>
          <h3 className="text-[12px] font-medium text-muted-foreground mb-2">
            {isJa ? `チェーン別 TVL (Top ${chainTvls.length})` : `TVL by chain (Top ${chainTvls.length})`}
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chainTvls} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  tickFormatter={(v: number) => formatCompact(v)}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <YAxis
                  type="category"
                  dataKey="chain"
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof chainTvls)[number];
                    return (
                      <div className="rounded-md border border-border bg-popover shadow-card p-2 text-[11px] space-y-0.5">
                        <div className="font-semibold">{p.chain}</div>
                        <div className="num tabular-nums">{formatCompact(p.tvl)}</div>
                        <div className="text-muted-foreground text-[10px]">
                          {((p.tvl / tvlNow) * 100).toFixed(1)}% {isJa ? 'シェア' : 'share'}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="tvl" radius={[0, 3, 3, 0]}>
                  {chainTvls.map((_, i) => (
                    <Cell key={i} fill={CHAIN_COLOR[i % CHAIN_COLOR.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {detail.hallmarks && detail.hallmarks.length > 0 && (
        <div>
          <h3 className="text-[12px] font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-tier-d" />
            {isJa ? '主要イベント' : 'Hallmarks'}
          </h3>
          <ul className="space-y-1 text-[11px]">
            {detail.hallmarks
              .slice(-6)
              .reverse()
              .map(([ts, label], i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground tabular-nums w-20 shrink-0">
                    {new Date(ts * 1000).toISOString().slice(0, 10)}
                  </span>
                  <span className="leading-snug">{label}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground/70 pt-2 border-t border-border/50">
        {isJa
          ? `データ: DeFiLlama (5 分キャッシュ) · ${detail.chains?.length ?? 0} チェーン展開`
          : `Data: DeFiLlama (5-min cache) · deployed across ${detail.chains?.length ?? 0} chains`}
      </div>
    </section>
  );
}

const CHAIN_COLOR = [
  '#635BFF',
  '#16C784',
  '#FFD700',
  '#FB923C',
  '#10B981',
  '#EA3943',
  '#9CA3AF',
];

function Kpi({ label, value, sub, valueClass }: { label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('num tabular-nums text-[13px] font-semibold', valueClass)}>{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
