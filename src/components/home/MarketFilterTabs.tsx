'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Flame, TrendingUp, TrendingDown, Sparkles, BarChart3 } from 'lucide-react';

export type FilterKey = 'all' | 'gainers' | 'losers' | 'trending' | 'recent' | 'volume';

interface MarketFilterTabsProps {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
  counts?: Partial<Record<FilterKey, number>>;
  locale?: string;
}

export function MarketFilterTabs({ active, onChange, counts, locale = 'ja' }: MarketFilterTabsProps) {
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  const tabs: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
    { key: 'all',      label: t('全銘柄', 'All Coins'),           icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: 'gainers',  label: t('値上がり', 'Top Gainers'),       icon: <TrendingUp className="h-3.5 w-3.5 text-gain" /> },
    { key: 'losers',   label: t('値下がり', 'Top Losers'),        icon: <TrendingDown className="h-3.5 w-3.5 text-loss" /> },
    { key: 'trending', label: t('トレンド', 'Trending'),          icon: <Flame className="h-3.5 w-3.5 text-tier-d" /> },
    { key: 'recent',   label: t('新規上場', 'Recently Added'),    icon: <Sparkles className="h-3.5 w-3.5 text-tier-a" /> },
    { key: 'volume',   label: t('取引高', 'Most Traded'),         icon: <BarChart3 className="h-3.5 w-3.5 text-primary" /> },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto thin-scrollbar border-b border-border/40 -mx-2 px-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium whitespace-nowrap transition-colors relative',
            active === tab.key
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.icon}
          {tab.label}
          {counts?.[tab.key] != null && (
            <span className="text-[9px] text-muted-foreground/60">({counts[tab.key]})</span>
          )}
          {active === tab.key && <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-primary" />}
        </button>
      ))}
    </div>
  );
}

/** Client-side filter renderer that swaps the table data based on tab */
export function useMarketFilter<T extends { rank: number | null; change_24h: number | null; volume_24h_usd: number | null }>(
  data: T[],
): [FilterKey, (k: FilterKey) => void, T[]] {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = (() => {
    switch (filter) {
      case 'gainers':
        return [...data]
          .filter((c) => c.change_24h != null && c.change_24h > 0)
          .sort((a, b) => (b.change_24h ?? 0) - (a.change_24h ?? 0));
      case 'losers':
        return [...data]
          .filter((c) => c.change_24h != null && c.change_24h < 0)
          .sort((a, b) => (a.change_24h ?? 0) - (b.change_24h ?? 0));
      case 'recent':
        return [...data].sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
      case 'volume':
        return [...data].sort((a, b) => (b.volume_24h_usd ?? 0) - (a.volume_24h_usd ?? 0));
      case 'trending':
      case 'all':
      default:
        return data;
    }
  })();

  return [filter, setFilter, filtered];
}
