'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Shield, ShieldAlert, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatCompact, cn } from '@/lib/utils';
import { exchangeMeta, classify, type ExchangeKind } from '@/lib/exchanges/registry';
import type { CgTicker } from '@/lib/api/coingecko';

interface MarketsTableProps {
  tickers: CgTicker[];
  /** Set of partner identifiers (CoinGecko market.identifier) that have an active /go affiliate link. */
  activeAffiliates: Set<string>;
  /** Display locale — controls JP regulator warnings + JP-domestic emphasis. */
  locale: string;
  coinSymbol: string;
}

type Tab = 'all' | 'cex' | 'dex';

export function MarketsTable({ tickers, activeAffiliates, locale, coinSymbol }: MarketsTableProps) {
  const [tab, setTab] = useState<Tab>('all');
  const [sortKey, setSortKey] = useState<'volume' | 'price' | 'spread'>('volume');

  const rows = useMemo(() => {
    const filtered = tickers.filter((t) => !t.is_stale && !t.is_anomaly);
    const byKind = filtered.filter((t) => {
      if (tab === 'all') return true;
      return classify(t.market.identifier) === (tab as ExchangeKind);
    });
    const sorted = [...byKind].sort((a, b) => {
      if (sortKey === 'volume') return (b.converted_volume?.usd ?? 0) - (a.converted_volume?.usd ?? 0);
      if (sortKey === 'price') return (b.converted_last?.usd ?? 0) - (a.converted_last?.usd ?? 0);
      return (a.bid_ask_spread_percentage ?? 99) - (b.bid_ask_spread_percentage ?? 99);
    });
    return sorted.slice(0, 50);
  }, [tickers, tab, sortKey]);

  const counts = useMemo(
    () => ({
      all: tickers.length,
      cex: tickers.filter((t) => classify(t.market.identifier) === 'cex').length,
      dex: tickers.filter((t) => classify(t.market.identifier) === 'dex' || classify(t.market.identifier) === 'aggregator').length,
    }),
    [tickers],
  );

  return (
    <section className="surface p-0 overflow-hidden">
      {/* Header + tabs */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-wrap">
        <h2 className="section-heading">
          {locale === 'ja' ? 'マーケット一覧' : 'Markets'}
          <span className="ml-2 text-[11px] text-muted-foreground font-normal">{tickers.length} {locale === 'ja' ? 'ペア' : 'pairs'}</span>
        </h2>
        <div className="flex items-center gap-1 rounded-md bg-muted/60 p-0.5">
          {(['all', 'cex', 'dex'] as Tab[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                'px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors',
                tab === k ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {k === 'all' ? (locale === 'ja' ? 'すべて' : 'All') : k.toUpperCase()}
              <span className="ml-1 text-muted-foreground/70 font-normal">{counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto thin-scrollbar">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="text-left">#</th>
              <th className="text-left">{locale === 'ja' ? '取引所' : 'Source'}</th>
              <th className="text-left">{locale === 'ja' ? 'ペア' : 'Pair'}</th>
              <th className="text-right sortable" onClick={() => setSortKey('price')}>
                <span className="inline-flex items-center gap-1">
                  {locale === 'ja' ? '価格' : 'Price'}
                  {sortKey === 'price' && <ArrowUpDown className="h-3 w-3" />}
                </span>
              </th>
              <th className="text-right sortable" onClick={() => setSortKey('spread')}>
                <span className="inline-flex items-center gap-1">
                  Spread
                  {sortKey === 'spread' && <ArrowUpDown className="h-3 w-3" />}
                </span>
              </th>
              <th className="text-right sortable" onClick={() => setSortKey('volume')}>
                <span className="inline-flex items-center gap-1">
                  {locale === 'ja' ? '24h 取引高' : '24h Volume'}
                  {sortKey === 'volume' && <ArrowUpDown className="h-3 w-3" />}
                </span>
              </th>
              <th className="text-center">{locale === 'ja' ? '信頼度' : 'Trust'}</th>
              <th className="text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const meta = exchangeMeta(t.market.identifier);
              const kind = classify(t.market.identifier);
              const hasAffiliate = meta.affiliate ? activeAffiliates.has(meta.affiliate) : false;
              const tradeHref = hasAffiliate
                ? `/go/${meta.affiliate}?coin=${coinSymbol}`
                : t.trade_url ?? `https://www.coingecko.com/en/exchanges/${t.market.identifier}`;
              return (
                <tr key={`${t.market.identifier}-${t.base}-${t.target}-${i}`}>
                  <td className="num text-muted-foreground text-[11px]">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {t.market.logo ? (
                        <Image src={t.market.logo} alt={t.market.name} width={28} height={28} className="rounded-full shrink-0 ring-1 ring-border" unoptimized />
                      ) : (
                        <div className={cn(
                          'w-7 h-7 rounded-full text-[11px] flex items-center justify-center font-bold shrink-0 ring-1 ring-border',
                          kind === 'dex' ? 'bg-tier-a/20 text-tier-a' : kind === 'aggregator' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          {t.market.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-[12.5px] truncate">{meta.name ?? t.market.name}</span>
                          {kind === 'dex' && <Badge variant="outline" className="text-[9px] py-0 h-4 bg-tier-a/10 text-tier-a border-tier-a/30">DEX</Badge>}
                          {kind === 'aggregator' && <Badge variant="outline" className="text-[9px] py-0 h-4 bg-primary/10 text-primary border-primary/30">AGG</Badge>}
                          {meta.region === 'jp' && <Badge variant="secondary" className="text-[9px] py-0 h-4 bg-tier-s/15 text-tier-s border-tier-s/30">JP</Badge>}
                          {meta.region === 'kr' && <Badge variant="secondary" className="text-[9px] py-0 h-4 bg-primary/10 text-primary border-primary/30">KR</Badge>}
                          {meta.jpfsaWarned && locale === 'ja' && (
                            <Badge variant="outline" className="text-[9px] py-0 h-4 text-tier-d border-tier-d/40" title="金融庁警告">⚠</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-[11px] text-muted-foreground">
                    {t.base}/<span className="text-foreground">{t.target}</span>
                  </td>
                  <td className="num tabular-nums text-right text-[12px]">
                    {formatPrice(t.converted_last?.usd ?? t.last)}
                  </td>
                  <td className="num tabular-nums text-right text-[11px] text-muted-foreground">
                    {t.bid_ask_spread_percentage != null ? `${t.bid_ask_spread_percentage.toFixed(3)}%` : '—'}
                  </td>
                  <td className="num tabular-nums text-right text-[12px] font-medium">
                    {formatCompact(t.converted_volume?.usd ?? 0)}
                  </td>
                  <td className="text-center">
                    <TrustDot score={t.trust_score} />
                  </td>
                  <td className="text-right">
                    <a
                      href={tradeHref}
                      target="_blank"
                      rel={hasAffiliate ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
                      className={cn(
                        'group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold transition-all whitespace-nowrap',
                        hasAffiliate
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-soft hover:shadow-card hover:-translate-y-px'
                          : 'border border-border text-foreground hover:border-primary/50 hover:bg-primary/[0.04] hover:text-primary',
                      )}
                    >
                      {locale === 'ja' ? '取引' : 'Trade'}
                      <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-[12px] text-muted-foreground py-6">
                  {locale === 'ja' ? '該当するマーケットがありません' : 'No markets in this view'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer disclosure */}
      <div className="px-4 py-2.5 text-[10px] text-muted-foreground border-t border-border bg-subtle">
        {locale === 'ja'
          ? '出典: CoinGecko · 一部リンクは Cointier のアフィリエイト広告です (sponsored タグ付き)。投資推奨ではありません。'
          : 'Source: CoinGecko · Some links are Cointier affiliate ads (marked with rel="sponsored"). Not investment advice.'}
      </div>
    </section>
  );
}

function TrustDot({ score }: { score: 'green' | 'yellow' | 'red' | null }) {
  if (score === 'green') return <ShieldCheck className="inline h-3.5 w-3.5 text-gain" />;
  if (score === 'yellow') return <Shield className="inline h-3.5 w-3.5 text-tier-d" />;
  if (score === 'red') return <ShieldAlert className="inline h-3.5 w-3.5 text-loss" />;
  return <span className="text-muted-foreground/40 text-[10px]">—</span>;
}
