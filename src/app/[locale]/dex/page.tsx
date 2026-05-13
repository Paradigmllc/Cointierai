/**
 * /dex — Cross-chain DEX overview.
 *
 *   Tab 1: Trending pairs (volume / liquidity turnover)
 *   Tab 2: DEX rankings by 24h volume (DefiLlama dexs overview)
 *   Tab 3: Top chains by DEX volume
 */
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Droplet, TrendingUp, Layers, ExternalLink } from 'lucide-react';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getChains } from '@/lib/api/defillama';
import { getDexRankings, getTrendingDexPairs } from '@/lib/db/ssot-queries';
import { formatCompact, formatPercent, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 900;
export const dynamic = "force-dynamic";

const CHAIN_COLOR: Record<string, string> = {
  ethereum: 'bg-[#627EEA]/15 text-[#627EEA]',
  solana: 'bg-[#9945FF]/15 text-[#9945FF]',
  bsc: 'bg-[#F0B90B]/15 text-[#F0B90B]',
  base: 'bg-[#0052FF]/15 text-[#0052FF]',
  arbitrum: 'bg-[#28A0F0]/15 text-[#28A0F0]',
  polygon: 'bg-[#8247E5]/15 text-[#8247E5]',
};

export default async function DexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const [topDexs, chains, trending] = await Promise.all([
    getDexRankings(80),
    getChains().catch(() => []),
    getTrendingDexPairs(50),
  ]);
  const topChains = [...chains].sort((a, b) => b.tvl - a.tvl).slice(0, 30);
  const total24h = topDexs.reduce((s, d) => s + (d.total_24h_usd ?? 0), 0);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'DEX マーケット' : 'DEX Market'}
        subtitle={`${topDexs.length} DEXs · $${formatCompact(total24h)} 24h volume`}
        meta={<PageBadge>DexScreener · DefiLlama</PageBadge>}
      />

      <Tabs defaultValue="trending">
        <TabsList>
          <TabsTrigger value="trending">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            Trending pairs ({trending.length})
          </TabsTrigger>
          <TabsTrigger value="dexs">
            <Droplet className="h-3.5 w-3.5 mr-1.5" />
            Top DEXs ({topDexs.length})
          </TabsTrigger>
          <TabsTrigger value="chains">
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            Chains
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          <div className="surface p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead>DEX</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">24h Δ</TableHead>
                  <TableHead className="text-right">Liquidity</TableHead>
                  <TableHead className="text-right">24h Volume</TableHead>
                  <TableHead className="text-right">Buy ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trending.slice(0, 50).map((p, i) => {
                  const buys = p.txns_24h_buys ?? 0;
                  const sells = p.txns_24h_sells ?? 0;
                  const total = buys + sells;
                  const buyRatio = total > 0 ? buys / total : 0.5;
                  const priceUsd = p.price_usd ?? null;
                  return (
                    <TableRow key={`${p.chain_id}-${p.pair_address}`}>
                      <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                      <TableCell>
                        <a href={p.url ?? '#'} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary inline-flex items-center gap-1">
                          {p.base_symbol}/<span className="text-muted-foreground">{p.quote_symbol ?? '?'}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                        </a>
                      </TableCell>
                      <TableCell className="text-[11px] capitalize text-muted-foreground">{p.dex_id ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[9px] uppercase', CHAIN_COLOR[p.chain_id] ?? '')}>
                          {p.chain_id}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right num tabular-nums">
                        {priceUsd ? `$${priceUsd < 0.01 ? priceUsd.toExponential(2) : priceUsd.toFixed(priceUsd < 1 ? 6 : 2)}` : '—'}
                      </TableCell>
                      <TableCell className={cn('text-right num tabular-nums text-[11px]', (p.price_change_24h ?? 0) >= 0 ? 'text-gain' : 'text-loss')}>
                        {(p.price_change_24h ?? 0) >= 0 ? '+' : ''}{formatPercent(p.price_change_24h ?? 0, 2)}
                      </TableCell>
                      <TableCell className="text-right num tabular-nums">${formatCompact(p.liquidity_usd ?? 0)}</TableCell>
                      <TableCell className="text-right num tabular-nums">${formatCompact(p.volume_24h_usd ?? 0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex w-16 h-3 rounded overflow-hidden border border-border/60">
                          <div className="bg-gain/70 h-full" style={{ width: `${buyRatio * 100}%` }} />
                          <div className="bg-loss/70 h-full" style={{ width: `${(1 - buyRatio) * 100}%` }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="dexs">
          <div className="surface p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>DEX</TableHead>
                  <TableHead>Chains</TableHead>
                  <TableHead className="text-right">24h Volume</TableHead>
                  <TableHead className="text-right">24h Δ</TableHead>
                  <TableHead className="text-right">7d Volume</TableHead>
                  <TableHead className="text-right">All-time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDexs.map((d, i) => (
                  <TableRow key={d.slug}>
                    <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {d.chains.slice(0, 3).map((c) => (
                        <Badge key={c} variant="secondary" className={cn('mr-1 text-[9px]', CHAIN_COLOR[c.toLowerCase()] ?? '')}>{c}</Badge>
                      ))}
                      {d.chains.length > 3 && <span>+{d.chains.length - 3}</span>}
                    </TableCell>
                    <TableCell className="text-right num tabular-nums">${formatCompact(d.total_24h_usd ?? 0)}</TableCell>
                    <TableCell className={cn('text-right num tabular-nums text-[11px]', (d.change_1d ?? 0) >= 0 ? 'text-gain' : 'text-loss')}>
                      {(d.change_1d ?? 0) >= 0 ? '+' : ''}{formatPercent(d.change_1d ?? 0, 2)}
                    </TableCell>
                    <TableCell className="text-right num tabular-nums">{d.total_7d_usd ? `$${formatCompact(d.total_7d_usd)}` : '—'}</TableCell>
                    <TableCell className="text-right num tabular-nums">{d.total_all_time_usd ? `$${formatCompact(d.total_all_time_usd)}` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="chains">
          <div className="surface p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead className="text-right">TVL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topChains.map((c, i) => (
                  <TableRow key={c.name}>
                    <TableCell className="text-muted-foreground text-[10px] tabular-nums">{i + 1}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn('text-[10px]', CHAIN_COLOR[c.name.toLowerCase()] ?? '')}>
                        {c.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right num tabular-nums">${formatCompact(c.tvl)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'DEX Market | Cointier' };
}
