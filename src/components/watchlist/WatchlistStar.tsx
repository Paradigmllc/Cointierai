'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { useWatchlist } from '@/lib/stores/watchlist';
import { cn } from '@/lib/utils';

interface Props {
  coinId: string;
  symbol?: string;
  name?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function WatchlistStar({ coinId, symbol, name, size = 'sm', className }: Props) {
  const { has, toggle, hydrate, ids } = useWatchlist();
  const filled = has(coinId);
  React.useEffect(() => {
    if (!ids) void hydrate();
  }, [hydrate, ids]);

  const px = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <button
      type="button"
      aria-label={filled ? `Remove ${symbol ?? coinId} from watchlist` : `Add ${symbol ?? coinId} to watchlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(coinId, { symbol, name });
      }}
      className={cn(
        'inline-flex items-center justify-center transition-colors',
        filled ? 'text-tier-s hover:text-tier-s/80' : 'text-muted-foreground/40 hover:text-tier-s',
        className,
      )}
    >
      <Star className={cn(px, filled && 'fill-current')} />
    </button>
  );
}
