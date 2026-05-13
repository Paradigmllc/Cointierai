import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/db/supabase';
import { Badge } from '@/components/ui/badge';
import { breadcrumbLd, articleLd, ldScript } from '@/lib/seo/jsonld';
import type { Locale } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

/**
 * UGC IDO 参加レポート pSEO ページ (Notion L2006-2023)
 *
 * 投稿 → /[locale]/ido/[slug]/reviews/[user] で自動生成
 * 「○○ IDO 参加レポート」検索流入 → 新規ユーザー Aha Moment
 *
 * SEO 資産が自律増殖する設計。
 */
interface PageProps {
  params: Promise<{ locale: Locale; slug: string; user: string }>;
}

export const revalidate = 3600;

export default async function UgcReviewPage({ params }: PageProps) {
  const { locale, slug, user } = await params;
  setRequestLocale(locale);
  const tCommon = await getTranslations('common');

  const supabase = await createServerSupabase();
  const { data: post } = await supabase
    .from('ugc_posts')
    .select('*')
    .eq('slug', slug)
    .eq('post_type', 'ido_review')
    .maybeSingle();

  if (!post || !post.is_published) notFound();

  const url = `${SITE_URL}/${locale}/ido/${slug}/reviews/${user}`;

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript([
        breadcrumbLd([
          { name: tCommon('siteName'), url: `/${locale}` },
          { name: 'IDO', url: `/${locale}/ido` },
          { name: post.title, url: `/${locale}/ido/${slug}/reviews/${user}` },
        ]),
        articleLd({
          title: post.title,
          description: post.content.slice(0, 160),
          url,
          locale,
        }),
      ])} />

      <header className="space-y-2">
        <Badge variant="secondary" className="text-[10px]">IDO 参加レポート (UGC)</Badge>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <p className="text-xs text-muted-foreground">
          投稿: {new Date(post.created_at).toISOString().slice(0, 10)} · 閲覧 {post.view_count}
        </p>
      </header>

      <article className="prose prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</div>
      </article>

      <div className="border-t border-border/40 pt-4 text-xs text-muted-foreground">
        {locale === 'ja'
          ? '※ 本レポートはユーザー投稿コンテンツです。投資判断はご自身で行ってください。'
          : 'User-generated content. Make your own investment decisions.'}
      </div>

      <Link href={`/ido`} className="text-sm text-primary hover:underline">
        &larr; {locale === 'ja' ? 'IDO 一覧へ戻る' : 'Back to IDO list'}
      </Link>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug, user } = await params;
  const supabase = await createServerSupabase();
  const { data: post } = await supabase.from('ugc_posts').select('title, content').eq('slug', slug).maybeSingle();
  if (!post) return { title: 'Not found' };
  return {
    title: post.title,
    description: post.content.slice(0, 160),
    alternates: {
      canonical: `${SITE_URL}/${locale}/ido/${slug}/reviews/${user}`,
    },
  };
}
