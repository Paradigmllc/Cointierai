'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  /** Categories pulled server-side from CoinGecko /coins/categories. */
  categories: Array<{ id: string; name: string }>;
}

const TIERS = [
  { value: 'all', label: 'All tiers' },
  { value: 's', label: 'Tier S' },
  { value: 'a', label: 'Tier A' },
  { value: 'b', label: 'Tier B' },
  { value: 'c', label: 'Tier C' },
  { value: 'd', label: 'Tier D' },
  { value: 'f', label: 'Tier F' },
];

export function CoinsTableFilters({ categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(sp.toString());
      if (!value || value === 'all') next.delete(key);
      else next.set(key, value);
      next.delete('page'); // reset pagination
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, sp],
  );

  const category = sp.get('category') ?? 'all';
  const tier = sp.get('tier') ?? 'all';
  const sort = sp.get('sort') ?? 'market_cap_desc';

  const activeChips: Array<[string, string]> = [];
  if (category !== 'all') {
    const cat = categories.find((c) => c.id === category);
    if (cat) activeChips.push(['category', cat.name]);
  }
  if (tier !== 'all') activeChips.push(['tier', `Tier ${tier.toUpperCase()}`]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-3.5 w-3.5 text-muted-foreground" />

      <Select value={category} onValueChange={(v) => update('category', v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.slice(0, 50).map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={tier} onValueChange={(v) => update('tier', v)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIERS.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => update('sort', v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="market_cap_desc">Market cap ↓</SelectItem>
          <SelectItem value="market_cap_asc">Market cap ↑</SelectItem>
          <SelectItem value="volume_desc">Volume 24h ↓</SelectItem>
          <SelectItem value="price_change_percentage_24h_desc">24h gain ↓</SelectItem>
          <SelectItem value="price_change_percentage_24h_asc">24h loss ↓</SelectItem>
        </SelectContent>
      </Select>

      {activeChips.length > 0 && (
        <div className="flex items-center gap-1.5">
          {activeChips.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => update(key, null)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] px-2 py-0.5 hover:bg-primary/20 transition-colors',
              )}
            >
              {label} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
