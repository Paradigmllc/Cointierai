'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import type { CgSearchResult } from '@/lib/api/coingecko';

interface SeedCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  rank: number | null;
}

interface Props {
  seeds: SeedCoin[];
  locale: 'ja' | 'en' | string;
}

const MAX = 4;

export function ComparePicker({ seeds, locale }: Props) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<SeedCoin[]>([]);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<CgSearchResult['coins']>([]);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json() as Promise<CgSearchResult>).catch(() => ({ coins: [], exchanges: [], categories: [], nfts: [] }));
      setResults(res.coins);
    }, 200);
  }, [query]);

  const add = (c: SeedCoin) => {
    if (selected.length >= MAX) return;
    if (selected.some((s) => s.id === c.id)) return;
    setSelected((prev) => [...prev, c]);
    setOpen(false);
    setQuery('');
  };

  const remove = (id: string) => setSelected((prev) => prev.filter((s) => s.id !== id));

  const canSubmit = selected.length >= 2;
  const submit = () => {
    if (!canSubmit) return;
    const slug = selected.map((s) => s.id).join('-vs-');
    router.push(`/${locale}/compare/${slug}`);
  };

  const popular = seeds.slice(0, 16);

  return (
    <div className="space-y-4">
      <div className="surface p-5 space-y-4">
        <div className="text-[12px] font-medium text-muted-foreground">
          {locale === 'ja' ? `選択中: ${selected.length}/${MAX}` : `Selected: ${selected.length}/${MAX}`}
        </div>
        <div className="flex items-center gap-2 flex-wrap min-h-[44px]">
          {selected.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 pl-1.5 pr-1 py-1 text-[12px]">
              <Image src={s.image} alt={s.symbol} width={16} height={16} className="rounded-full" unoptimized />
              <span className="font-medium">{s.symbol.toUpperCase()}</span>
              <button onClick={() => remove(s.id)} className="hover:text-loss" aria-label={`Remove ${s.symbol}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selected.length < MAX && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-subtle px-3 py-1 text-[12px] hover:border-primary hover:text-primary transition-colors">
                  <Plus className="h-3 w-3" /> Add coin
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Search coin…" value={query} onValueChange={setQuery} />
                  <CommandList>
                    <CommandEmpty>{query ? 'No matches' : 'Type to search'}</CommandEmpty>
                    {results.length > 0 && (
                      <CommandGroup heading="Results">
                        {results.slice(0, 10).map((c) => (
                          <CommandItem
                            key={c.id}
                            onSelect={() => add({ id: c.id, symbol: c.symbol, name: c.name, image: c.thumb, rank: c.market_cap_rank ?? null })}
                          >
                            <Image src={c.thumb} alt={c.symbol} width={16} height={16} className="rounded-full" unoptimized />
                            <span className="flex-1">{c.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{c.symbol}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {!query && (
                      <CommandGroup heading="Top by market cap">
                        {popular.map((c) => (
                          <CommandItem key={c.id} onSelect={() => add(c)}>
                            <Image src={c.image} alt={c.symbol} width={16} height={16} className="rounded-full" unoptimized />
                            <span className="flex-1">{c.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{c.symbol}</span>
                            {c.rank && <Badge variant="secondary" className="text-[9px]">#{c.rank}</Badge>}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <Button onClick={submit} disabled={!canSubmit} size="sm">
          {locale === 'ja' ? '比較する' : 'Compare'}
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      <div className="surface p-5 space-y-3">
        <h3 className="text-sm font-semibold">{locale === 'ja' ? '人気の比較' : 'Popular comparisons'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            ['bitcoin', 'ethereum'],
            ['solana', 'cardano'],
            ['ethereum', 'solana'],
            ['bnb', 'solana'],
          ].map(([a, b]) => (
            <a
              key={`${a}-${b}`}
              href={`/${locale}/compare/${a}-vs-${b}`}
              className="rounded-lg border border-border bg-subtle p-3 text-[12px] hover:border-primary hover:bg-accent/30 transition-colors text-center"
            >
              <span className="font-medium uppercase">{a}</span> vs <span className="font-medium uppercase">{b}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
