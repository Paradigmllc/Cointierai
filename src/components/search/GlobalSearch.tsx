'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Search, Loader2, TrendingUp, ArrowUpRight, Star, Coins, Building2, Tag } from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { CgSearchResult } from '@/lib/api/coingecko';

interface RecentEntry {
  type: 'coin' | 'exchange' | 'category';
  id: string;
  name: string;
  symbol?: string;
  thumb?: string;
}

const LS_KEY = 'cointier:recent_search';
const MAX_RECENT = 8;

function loadRecent(): RecentEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as RecentEntry[];
  } catch {
    return [];
  }
}

function saveRecent(entry: RecentEntry) {
  if (typeof window === 'undefined') return;
  const list = loadRecent().filter((e) => !(e.type === entry.type && e.id === entry.id));
  list.unshift(entry);
  localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

export function GlobalSearch({ triggerClassName }: { triggerClassName?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common');
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<CgSearchResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [recent, setRecent] = React.useState<RecentEntry[]>([]);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ⌘K / Ctrl+K to open
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    if (open) setRecent(loadRecent());
  }, [open]);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json() as Promise<CgSearchResult>);
        setResults(res);
      } catch {
        setResults({ coins: [], exchanges: [], categories: [], nfts: [] });
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const go = (path: string, entry?: RecentEntry) => {
    if (entry) saveRecent(entry);
    setOpen(false);
    setQuery('');
    router.push(`/${locale}${path}`);
  };

  return (
    <>
      <button
        type="button"
        aria-label={t('search')}
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          'inline-flex items-center gap-2 h-9 w-full max-w-sm rounded-md border border-border bg-card pl-9 pr-2 text-[12px] text-muted-foreground hover:bg-accent transition-colors relative'
        }
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left">{t('searchPlaceholder')}</span>
        <kbd className="pointer-events-none hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium opacity-100">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 max-w-2xl">
          <Command shouldFilter={false}>
            <CommandInput placeholder={t('searchPlaceholder')} value={query} onValueChange={setQuery} />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center py-6 text-[11px] text-muted-foreground gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching…
                </div>
              )}
              {!loading && query.trim() && !results?.coins.length && !results?.exchanges.length && !results?.categories.length && (
                <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>
              )}
              {!query.trim() && recent.length > 0 && (
                <CommandGroup heading="Recent">
                  {recent.map((r) => (
                    <CommandItem
                      key={`${r.type}:${r.id}`}
                      onSelect={() =>
                        go(
                          r.type === 'coin'
                            ? `/coin/${r.id}`
                            : r.type === 'exchange'
                              ? `/exchange/${r.id}`
                              : `/category/${r.id}`,
                          r,
                        )
                      }
                    >
                      {r.thumb ? (
                        <Image src={r.thumb} alt={r.name} width={18} height={18} className="rounded-full" unoptimized />
                      ) : (
                        <Star className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="flex-1">{r.name}</span>
                      {r.symbol && <span className="text-[10px] text-muted-foreground uppercase">{r.symbol}</span>}
                      <ArrowUpRight className="h-3 w-3 opacity-30" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!query.trim() && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Quick navigation">
                    <CommandItem onSelect={() => go('/coins')}>
                      <Coins className="h-3.5 w-3.5" />
                      All coins
                      <CommandShortcut>/coins</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => go('/exchanges')}>
                      <Building2 className="h-3.5 w-3.5" />
                      Exchanges
                    </CommandItem>
                    <CommandItem onSelect={() => go('/sectors')}>
                      <Tag className="h-3.5 w-3.5" />
                      Sectors / Categories
                    </CommandItem>
                    <CommandItem onSelect={() => go('/yields')}>
                      <TrendingUp className="h-3.5 w-3.5" />
                      Yield opportunities
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              {results?.coins && results.coins.length > 0 && (
                <CommandGroup heading={`Coins (${results.coins.length})`}>
                  {results.coins.slice(0, 12).map((c) => (
                    <CommandItem
                      key={c.id}
                      onSelect={() => go(`/coin/${c.id}`, { type: 'coin', id: c.id, name: c.name, symbol: c.symbol, thumb: c.thumb })}
                    >
                      <Image src={c.thumb} alt={c.symbol} width={18} height={18} className="rounded-full" unoptimized />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{c.symbol}</span>
                      {c.market_cap_rank && (
                        <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">#{c.market_cap_rank}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.exchanges && results.exchanges.length > 0 && (
                <CommandGroup heading={`Exchanges (${results.exchanges.length})`}>
                  {results.exchanges.slice(0, 6).map((e) => (
                    <CommandItem
                      key={e.id}
                      onSelect={() => go(`/exchanges?focus=${e.id}`, { type: 'exchange', id: e.id, name: e.name, thumb: e.thumb })}
                    >
                      <Image src={e.thumb} alt={e.name} width={18} height={18} className="rounded-full" unoptimized />
                      <span className="flex-1">{e.name}</span>
                      <span className="text-[10px] text-muted-foreground">{e.market_type}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.categories && results.categories.length > 0 && (
                <CommandGroup heading={`Categories (${results.categories.length})`}>
                  {results.categories.slice(0, 8).map((cat) => (
                    <CommandItem
                      key={cat.id}
                      onSelect={() => go(`/category/${cat.id}`, { type: 'category', id: String(cat.id), name: cat.name })}
                    >
                      <Tag className="h-3.5 w-3.5" />
                      <span className="flex-1">{cat.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
