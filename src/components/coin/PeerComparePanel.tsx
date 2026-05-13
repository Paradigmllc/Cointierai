import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { getMarkets, type CgMarketCoin } from '@/lib/api/coingecko';
import { formatPrice, formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';

interface Props {
  currentId: string;
  category?: string | null;
  locale: 'ja' | 'en' | string;
}

export async function PeerComparePanel({ currentId, category, locale }: Props) {
  // CG markets supports ?category= for ecosystem peer fetch. Fallback to top market if no category mapping.
  let peers: CgMarketCoin[] = [];
  if (category) {
    peers = await getMarkets({ category: slugifyCategory(category), perPage: 12, sparkline: false }).catch(() => []);
  }
  if (peers.length === 0) {
    peers = await getMarkets({ perPage: 12, sparkline: false }).catch(() => []);
  }
  peers = peers.filter((p) => p.id !== currentId).slice(0, 10);
  if (peers.length === 0) return null;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {locale === 'ja' ? '同カテゴリの銘柄' : 'Similar coins'}
        </h2>
        <span className="text-[10px] text-muted-foreground">{category ?? 'Top 10'}</span>
      </div>
      <div className="rounded-lg border border-border bg-subtle divide-y divide-border/60">
        {peers.map((p) => (
          <Link key={p.id} href={`/coin/${p.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/30 transition-colors text-[12px]">
            <span className="text-muted-foreground w-6 tabular-nums text-[10px]">#{p.market_cap_rank ?? '—'}</span>
            <Image src={p.image} alt={p.symbol} width={18} height={18} className="rounded-full shrink-0" unoptimized />
            <span className="font-medium flex-1 truncate">{p.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{p.symbol}</span>
            <span className="num tabular-nums w-20 text-right shrink-0">{formatPrice(p.current_price)}</span>
            <span className={cn('num tabular-nums w-16 text-right shrink-0 text-[11px]', changeColor(p.price_change_percentage_24h))}>
              {formatPercent(p.price_change_percentage_24h, 1)}
            </span>
            <span className="num tabular-nums w-20 text-right shrink-0 text-[11px] text-muted-foreground">
              {p.market_cap ? formatCompact(p.market_cap) : '—'}
            </span>
            <ArrowUpRight className="h-3 w-3 text-muted-foreground/40" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function slugifyCategory(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
