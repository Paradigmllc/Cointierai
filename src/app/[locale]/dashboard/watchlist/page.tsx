'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Star, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '@/components/coin/TierBadge';
import { Link } from '@/i18n/routing';
import { formatPrice, formatPercent, changeColor, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Coin } from '@/types/database';

/**
 * Watchlist — Free 機能 (Notion L1646-1647)
 *
 * カスタマイズが深いほど移行コスト増 = ロックイン Layer 1
 */
export default function WatchlistPage() {
  const tT = useTranslations();
  const locale = useLocale();
  const [watchlist, setWatchlist] = useState<Coin[]>([]);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [loading, setLoading] = useState(false);

  // localStorage-based watchlist (M3 で Supabase 連携)
  useEffect(() => {
    const saved = localStorage.getItem('cointier-watchlist');
    if (saved) {
      try {
        const ids = JSON.parse(saved) as string[];
        if (ids.length) loadCoins(ids);
      } catch {}
    }
  }, []);

  async function loadCoins(ids: string[]) {
    setLoading(true);
    try {
      const coins = await Promise.all(
        ids.map((id) => fetch(`/api/coin/${id}`).then((r) => (r.ok ? r.json() : null))),
      );
      setWatchlist(coins.filter(Boolean).map((c) => c.data) as Coin[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function add(symbol: string) {
    const id = symbol.toLowerCase().trim();
    if (!id) return;
    const saved = JSON.parse(localStorage.getItem('cointier-watchlist') ?? '[]') as string[];
    if (saved.includes(id)) {
      toast.error(tT('dashWatchlist.alreadyInWatchlist'));
      return;
    }
    const newList = [...saved, id];
    localStorage.setItem('cointier-watchlist', JSON.stringify(newList));
    loadCoins(newList);
    setSearchSymbol('');
    toast.success(tT('dashWatchlist.added'));
  }

  function remove(id: string) {
    const saved = JSON.parse(localStorage.getItem('cointier-watchlist') ?? '[]') as string[];
    const newList = saved.filter((s) => s !== id);
    localStorage.setItem('cointier-watchlist', JSON.stringify(newList));
    setWatchlist(watchlist.filter((c) => c.id !== id));
  }

  return (
    <div className="container py-4 max-w-4xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-tier-s/10">
          <Star className="h-6 w-6 text-tier-s" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {tT('dashboard.watchlist')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {tT('dashWatchlist.manageFavoriteCoinsFree')}
          </p>
        </div>
      </header>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
        <h2 className="font-semibold text-sm">{tT('dashWatchlist.addCoin')}</h2>
        <div className="flex gap-2">
          <Input
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            placeholder={tT('dashWatchlist.symbolEGBitcoin')}
            onKeyDown={(e) => e.key === 'Enter' && add(searchSymbol)}
          />
          <Button onClick={() => add(searchSymbol)} disabled={!searchSymbol}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8">{tT('dashWatchlist.loading')}</div>
      ) : watchlist.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          <Star className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{tT('dashWatchlist.noCoinsInWatchlistYet')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>{tT('dashWatchlist.coin')}</th>
                <th>{tT('dashWatchlist.price')}</th>
                <th>24h</th>
                <th>7d</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((c) => (
                <tr key={c.id}>
                  <td><TierBadge tier={c.tier} size="sm" /></td>
                  <td>
                    <Link href={`/coin/${c.id}`} className="hover:text-primary">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 uppercase">{c.symbol}</span>
                    </Link>
                  </td>
                  <td className="num">{formatPrice(c.price_usd)}</td>
                  <td className={cn('num', changeColor(c.change_24h))}>{formatPercent(c.change_24h)}</td>
                  <td className={cn('num', changeColor(c.change_7d))}>{formatPercent(c.change_7d)}</td>
                  <td>
                    <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-loss" aria-label="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Badge variant="secondary" className="text-[10px]">
        {tT('dashWatchlist.proAlertsComingInM3')}
      </Badge>
    </div>
  );
}
