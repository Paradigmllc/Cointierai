import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/db/supabase';
import { CoinsTable } from '@/components/tables/CoinsTable';
import { breadcrumbLd, articleLd, itemListLd, ldScript } from '@/lib/seo/jsonld';
import type { Locale } from '@/i18n/routing';
import type { Coin } from '@/types/database';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const tCommon = await getTranslations('common');

  const supabase = await createServerSupabase();
  const { data: category } = await supabase.from('categories').select('*').eq('id', slug).maybeSingle();
  if (!category) notFound();

  // Coins in this category
  const { data: links } = await supabase.from('coin_categories').select('coin_id').eq('category_id', slug).limit(250);
  const coinIds = (links ?? []).map((l) => l.coin_id);

  let coins: Coin[] = [];
  if (coinIds.length) {
    const { data } = await supabase
      .from('coins')
      .select('*')
      .in('id', coinIds)
      .order('market_cap_usd', { ascending: false, nullsFirst: false });
    coins = (data as Coin[]) ?? [];
  }

  const categoryName = (category.name as Record<string, string>)?.[locale] ?? (category.name as Record<string, string>)?.en ?? slug;
  const totalMarketCap = coins.reduce((s, c) => s + (c.market_cap_usd ?? 0), 0);
  const url = `${SITE_URL}/${locale}/category/${slug}`;

  return (
    <div className="container py-8 space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript([
        breadcrumbLd([
          { name: tCommon('siteName'), url: `/${locale}` },
          { name: 'Categories', url: `/${locale}/coins` },
          { name: categoryName, url: `/${locale}/category/${slug}` },
        ]),
        articleLd({
          title: `${categoryName} — Cointier`,
          description: `${categoryName} category overview · ${coins.length} cryptocurrencies tracked.`,
          url,
          locale,
        }),
        itemListLd({
          name: categoryName,
          description: `Top ${categoryName} cryptocurrencies`,
          url,
          items: coins.slice(0, 50).map((c, i) => ({ name: c.name, url: `${SITE_URL}/${locale}/coin/${c.id}`, rank: i + 1 })),
        }),
      ])} />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{categoryName}</h1>
        <p className="text-sm text-muted-foreground">
          {coins.length} coins · Total Market Cap ${(totalMarketCap / 1e9).toFixed(2)}B
        </p>
      </header>

      <CoinsTable data={coins} pageSize={50} />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  return {
    title: slug,
    alternates: {
      canonical: `${SITE_URL}/${locale}/category/${slug}`,
      languages: Object.fromEntries(['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'].map((l) => [l, `${SITE_URL}/${l}/category/${slug}`])),
    },
  };
}
