import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Check, Sparkles, Zap, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

/**
 * Pricing — Stripe-inspired 3-tier card grid.
 * - Decoy positioning: Pro is highlighted with shimmer accent + scale ring.
 * - Yearly is the default display (CLAUDE.md J rule: 年額デフォルト + 29%OFF).
 * - Free / Pro / Business clear visual hierarchy via card shadow + accent.
 */
export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('pricing');
  const tCommon = await getTranslations('common');

  const plans = [
    {
      key: 'free' as const,
      name: t('free.name'),
      price: t('free.price'),
      description: t('free.description'),
      features: t.raw('free.features') as string[],
      cta: tCommon('free'),
      accent: 'neutral' as const,
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      key: 'pro' as const,
      name: t('pro.name'),
      monthlyPrice: t('pro.monthlyPrice'),
      yearlyPrice: t('pro.yearlyPrice'),
      description: t('pro.description'),
      features: t.raw('pro.features') as string[],
      cta: t('pro.cta'),
      accent: 'primary' as const,
      icon: <Zap className="h-4 w-4" />,
    },
    {
      key: 'business' as const,
      name: t('business.name'),
      monthlyPrice: t('business.monthlyPrice'),
      description: t('business.description'),
      features: t.raw('business.features') as string[],
      cta: t('business.cta'),
      accent: 'neutral' as const,
      icon: <Building2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="container py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="secondary" className="text-[11px] mb-2">
          <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
          {t('yearlyDiscount')}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed">{t('subtitle')}</p>
      </div>

      {/* 3-tier grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isPro = plan.accent === 'primary';
          const yearly = (plan as { yearlyPrice?: string }).yearlyPrice;
          const monthly = (plan as { monthlyPrice?: string }).monthlyPrice;
          return (
            <div
              key={plan.key}
              className={cn(
                'relative rounded-xl border p-6 space-y-5 flex flex-col bg-card transition-all',
                isPro
                  ? 'border-primary/40 shadow-lifted ring-1 ring-primary/30 md:scale-[1.02]'
                  : 'border-border shadow-card hover:shadow-lifted',
              )}
            >
              {/* Shimmer accent for Pro (Stripe-like soft glow) */}
              {isPro && (
                <div
                  className="pointer-events-none absolute -inset-px rounded-xl opacity-50"
                  style={{
                    background:
                      'radial-gradient(circle at top right, rgba(99,91,255,0.18), transparent 60%)',
                  }}
                />
              )}
              {isPro && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t('popular')}
                </Badge>
              )}

              <div className="relative space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn(isPro ? 'text-primary' : 'text-muted-foreground')}>{plan.icon}</span>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{plan.description}</p>
              </div>

              <div className="relative space-y-1.5">
                {plan.key === 'free' ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl md:text-4xl font-bold">{(plan as { price: string }).price}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl md:text-4xl font-bold tabular-nums">{yearly ?? monthly}</span>
                      <span className="text-[12px] text-muted-foreground">
                        / {yearly ? t('yearly').toLowerCase() : t('monthly').toLowerCase()}
                      </span>
                    </div>
                    {yearly && monthly && (
                      <div className="text-[11px] text-muted-foreground">
                        {monthly} {t('monthly').toLowerCase()} ·{' '}
                        <span className="text-primary font-medium">{t('yearlyDiscount')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <ul className="relative space-y-2 text-[13px] flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className={cn('h-4 w-4 shrink-0 mt-0.5', isPro ? 'text-primary' : 'text-gain')} />
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn('relative w-full', isPro && 'shadow-soft')}
                variant={isPro ? 'default' : 'outline'}
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Footnote */}
      <p className="text-center text-[11px] text-muted-foreground max-w-2xl mx-auto">
        {locale === 'ja'
          ? '※ 価格は税込。Pro は確定申告レポート自動生成 + Hyperliquid Builder Fee 連携が含まれます。Business は API + pClaim プレミアム掲載が追加されます。'
          : 'Prices include tax. Pro adds tax-report PDF + Hyperliquid Builder Fee integration. Business layers in API + pClaim premium listing.'}
      </p>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return { title: t('title') };
}
