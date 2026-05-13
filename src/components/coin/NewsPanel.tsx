'use client';

import { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  symbol: string;
  locale: 'ja' | 'en' | string;
}

interface CpItem {
  id: number;
  title: string;
  url: string;
  published_at: string;
  source: { title: string; domain: string };
  votes?: { positive: number; negative: number; important: number };
}

export function NewsPanel({ symbol, locale }: Props) {
  const [items, setItems] = useState<CpItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/news?currencies=${symbol.toUpperCase()}`).catch(() => null);
      if (!res || !res.ok) {
        if (!cancelled) setItems([]);
        return;
      }
      const data = (await res.json()) as { items: CpItem[] };
      if (!cancelled) setItems(data.items);
    })();
    return () => { cancelled = true; };
  }, [symbol]);

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Newspaper className="h-4 w-4 text-primary" />{locale === 'ja' ? 'ニュース' : 'Latest news'}</h2>
        <a href={`https://cryptopanic.com/news/${symbol.toLowerCase()}/`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">
          CryptoPanic →
        </a>
      </div>
      {items === null && <div className="py-6 text-center text-[11px] text-muted-foreground">Loading…</div>}
      {items && items.length === 0 && (
        <div className="py-4 text-center text-[11px] text-muted-foreground">
          {locale === 'ja' ? 'ニュースなし (CryptoPanic API キー未設定の可能性)' : 'No news available (CryptoPanic key may be unset)'}
        </div>
      )}
      {items && items.length > 0 && (
        <div className="rounded-lg border border-border bg-subtle divide-y divide-border/60">
          {items.slice(0, 10).map((p) => {
            const positive = p.votes?.positive ?? 0;
            const negative = p.votes?.negative ?? 0;
            const sentiment = positive - negative;
            return (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors group"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="text-[12px] font-medium leading-snug group-hover:text-primary line-clamp-2">{p.title}</div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{p.source.title}</span>
                    <span>·</span>
                    <span className="tabular-nums">{new Date(p.published_at).toLocaleDateString()}</span>
                    {sentiment !== 0 && (
                      <span className={cn('inline-flex items-center gap-0.5', sentiment > 0 ? 'text-gain' : 'text-loss')}>
                        {sentiment > 0 ? <ThumbsUp className="h-2.5 w-2.5" /> : <ThumbsDown className="h-2.5 w-2.5" />}
                        {Math.abs(sentiment)}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground/40 mt-0.5 shrink-0" />
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
