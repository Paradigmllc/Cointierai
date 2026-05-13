/**
 * /news — global crypto news (CryptoPanic).
 */
import { setRequestLocale } from 'next-intl/server';
import { Newspaper, Flame, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getGlobalNews, type NewsRow } from '@/lib/db/ssot-queries';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

export const revalidate = 300;
export const dynamic = "force-dynamic";

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const [hot, rising, bullish, bearish, important] = await Promise.all([
    getGlobalNews('hot'),
    getGlobalNews('rising'),
    getGlobalNews('bullish'),
    getGlobalNews('bearish'),
    getGlobalNews('important'),
  ]);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'ニュース' : 'Crypto News'}
        subtitle={`${hot.length} hot · ${rising.length} rising · ${important.length} important`}
        meta={<PageBadge>CryptoPanic</PageBadge>}
      />

      <Tabs defaultValue="hot">
        <TabsList>
          <TabsTrigger value="hot"><Flame className="h-3 w-3 mr-1.5" />Hot</TabsTrigger>
          <TabsTrigger value="rising"><TrendingUp className="h-3 w-3 mr-1.5" />Rising</TabsTrigger>
          <TabsTrigger value="bullish"><ThumbsUp className="h-3 w-3 mr-1.5" />Bullish</TabsTrigger>
          <TabsTrigger value="bearish"><ThumbsDown className="h-3 w-3 mr-1.5" />Bearish</TabsTrigger>
          <TabsTrigger value="important">Important</TabsTrigger>
        </TabsList>
        {[['hot', hot], ['rising', rising], ['bullish', bullish], ['bearish', bearish], ['important', important]].map(([key, items]) => (
          <TabsContent key={key as string} value={key as string}>
            <NewsList items={items as NewsRow[]} locale={locale} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function NewsList({ items, locale }: { items: NewsRow[]; locale: Locale }) {
  if (items.length === 0) {
    return (
      <div className="surface p-8 text-center text-[12px] text-muted-foreground">
        {locale === 'ja' ? 'CryptoPanic API キー未設定の可能性' : 'CryptoPanic API key not configured'}
      </div>
    );
  }
  return (
    <div className="surface divide-y divide-border/60">
      {items.map((p) => {
        const positive = p.votes_positive ?? 0;
        const negative = p.votes_negative ?? 0;
        const sentiment = positive - negative;
        return (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors group"
          >
            <Newspaper className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-[13px] font-medium leading-snug group-hover:text-primary">{p.title}</div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                <span className="font-medium text-foreground/70">{p.source_title ?? p.source_domain ?? '—'}</span>
                <span>·</span>
                <span className="tabular-nums">{new Date(p.published_at).toLocaleString()}</span>
                {(p.currencies ?? []).slice(0, 3).map((code) => (
                  <span key={code} className="inline-block px-1.5 rounded bg-muted text-foreground/70 text-[9px] uppercase">{code}</span>
                ))}
                {sentiment !== 0 && (
                  <span className={cn('inline-flex items-center gap-0.5 ml-auto', sentiment > 0 ? 'text-gain' : 'text-loss')}>
                    {sentiment > 0 ? <ThumbsUp className="h-2.5 w-2.5" /> : <ThumbsDown className="h-2.5 w-2.5" />}
                    {Math.abs(sentiment)}
                  </span>
                )}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Crypto News | Cointier' };
}
