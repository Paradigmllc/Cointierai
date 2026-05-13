import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createServerSupabase } from '@/lib/db/supabase';
import { formatCompact, cn } from '@/lib/utils';
import { breadcrumbLd, ldScript, articleLd } from '@/lib/seo/jsonld';
import type { Locale } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

export const revalidate = 600;

/**
 * 予測マーケット一覧 (Notion L2266-2424)
 *
 * M1 段階: Polymarket データ表示のみ
 *   - 取引は外部リンク (賭博罪・幇助リスク回避)
 *   - 免責表記徹底
 *   - 「予測情報」「投資判断はご自身で」明記
 */
export default async function PredictionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tT = await getTranslations({ locale });
  setRequestLocale(locale as Locale);
  const tCommon = await getTranslations('common');

  const supabase = await createServerSupabase();
  const { data: markets } = await supabase
    .from('polymarket_markets')
    .select('*')
    .eq('is_active', true)
    .order('volume_usd', { ascending: false, nullsFirst: false })
    .limit(50);

  const url = `${SITE_URL}/${locale}/predictions`;

  return (
    <div className="container py-4 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript([
        breadcrumbLd([
          { name: tCommon('siteName'), url: `/${locale}` },
          { name: tT('predictions.predictions'), url: `/${locale}/predictions` },
        ]),
        articleLd({
          title: tT('predictions.predictionMarketsPolymarket'),
          description: tT('predictions.predictionsOnBtcEthRegulatory'),
          url,
          locale,
        }),
      ])} />

      <header className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-tier-d" />
          {tT('predictions.predictionMarkets')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {tT('predictions.polymarketPredictionMarketsRelatedTo')}
        </p>
      </header>

      <div className="rounded-lg border border-tier-d/30 bg-tier-d/5 p-4 text-xs text-muted-foreground">
        {locale === 'ja' ? (
          <>
            <strong className="text-foreground">⚠️ 免責:</strong> 本ページは Polymarket の予測マーケット情報を表示するのみで、取引斡旋・投資推奨ではありません。取引は Polymarket の外部サイトで自己責任で行ってください。日本国内では賭博罪に該当する可能性があり、Cointier は取引について一切の責任を負いません。
          </>
        ) : (
          <>
            <strong className="text-foreground">⚠️ Disclaimer:</strong> This page only displays Polymarket data. Trading happens on Polymarket.com at your own risk. Not investment advice. Not available in restricted jurisdictions.
          </>
        )}
      </div>

      {(!markets || markets.length === 0) ? (
        <div className="rounded-lg border border-border/60 bg-card/30 p-12 text-center text-muted-foreground">
          {tT('predictions.noMarketsYetRunNpm')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {markets.map((m) => {
            const yes = (m.yes_price ?? 0) * 100;
            const no = (m.no_price ?? 0) * 100;
            return (
              <div key={m.id} className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold leading-relaxed">{m.question_ja ?? m.question}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Vol {formatCompact(m.volume_usd)} ·{' '}
                    {tT('predictions.ends')} {m.end_date ? new Date(m.end_date).toISOString().slice(0, 10) : '—'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 rounded-md border border-gain/30 bg-gain/5 px-3 py-2 text-center">
                    <div className="text-[10px] text-muted-foreground">YES</div>
                    <div className="text-lg font-bold num text-gain">{yes.toFixed(0)}¢</div>
                  </div>
                  <div className="flex-1 rounded-md border border-loss/30 bg-loss/5 px-3 py-2 text-center">
                    <div className="text-[10px] text-muted-foreground">NO</div>
                    <div className="text-lg font-bold num text-loss">{no.toFixed(0)}¢</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {m.related_coin_id && (
                    <Link href={`/coin/${m.related_coin_id}`} className="text-xs text-primary hover:underline">
                      {m.related_coin_id}
                    </Link>
                  )}
                  <a href={m.external_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
                    Polymarket <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tT = await getTranslations({ locale });
  return {
    title: tT('predictions.predictionMarkets'),
    alternates: {
      canonical: `${SITE_URL}/${locale}/predictions`,
      languages: Object.fromEntries(['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'].map((l) => [l, `${SITE_URL}/${l}/predictions`])),
    },
  };
}
