import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

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
      highlighted: false,
    },
    {
      key: 'pro' as const,
      name: t('pro.name'),
      monthlyPrice: t('pro.monthlyPrice'),
      yearlyPrice: t('pro.yearlyPrice'),
      description: t('pro.description'),
      features: t.raw('pro.features') as string[],
      cta: t('pro.cta'),
      highlighted: true,
    },
    {
      key: 'business' as const,
      name: t('business.name'),
      monthlyPrice: t('business.monthlyPrice'),
      description: t('business.description'),
      features: t.raw('business.features') as string[],
      cta: t('business.cta'),
      highlighted: false,
    },
  ];

  return (
    <div className="container py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
        <Badge variant="success" className="text-xs">{t('yearlyDiscount')}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={cn(
              'rounded-xl border p-6 space-y-5 flex flex-col',
              plan.highlighted ? 'border-primary/50 bg-primary/5 relative shadow-lg shadow-primary/10' : 'border-border/60 bg-card/30',
            )}
          >
            {plan.highlighted && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3">
                <Sparkles className="h-3 w-3 mr-1" />
                {t('popular')}
              </Badge>
            )}
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>
            <div className="space-y-1">
              {plan.key === 'free' ? (
                <div className="text-3xl font-bold">{plan.price}</div>
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {(plan as { yearlyPrice?: string; monthlyPrice: string }).yearlyPrice ?? plan.monthlyPrice}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / {(plan as { yearlyPrice?: string }).yearlyPrice ? t('yearly').toLowerCase() : t('monthly').toLowerCase()}
                    </span>
                  </div>
                  {(plan as { yearlyPrice?: string }).yearlyPrice && (
                    <div className="text-xs text-muted-foreground">
                      ({plan.monthlyPrice} {t('monthly').toLowerCase()})
                    </div>
                  )}
                </>
              )}
            </div>
            <ul className="space-y-2 text-sm flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-gain shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return { title: t('title') };
}
