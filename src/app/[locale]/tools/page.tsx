import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Activity, Calendar, Calculator, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Locale } from '@/i18n/routing';

export default async function ToolsHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('tools');

  const tools = [
    {
      href: '/tools/risk-score',
      icon: <Activity className="h-6 w-6 text-tier-d" />,
      title: t('riskScore.title'),
      subtitle: t('riskScore.subtitle'),
      badge: 'Aha Moment',
    },
    {
      href: '/tools/unlock-calendar',
      icon: <Calendar className="h-6 w-6 text-primary" />,
      title: t('unlockCalendar.title'),
      subtitle: t('unlockCalendar.subtitle'),
      badge: 'Free 7d / Pro 90d',
    },
    {
      href: '/tools/ido-roi',
      icon: <Calculator className="h-6 w-6 text-gain" />,
      title: t('idoRoi.title'),
      subtitle: t('idoRoi.subtitle'),
      badge: 'Always Free',
    },
  ];

  return (
    <div className="container py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold">{t('title')}</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-lg border border-border/60 bg-card/30 p-6 space-y-4 hover:border-primary/40 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-muted/50">{tool.icon}</div>
              <Badge variant="secondary" className="text-[10px]">{tool.badge}</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{tool.title}</h3>
              <p className="text-sm text-muted-foreground">{tool.subtitle}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools' });
  return { title: t('title') };
}
