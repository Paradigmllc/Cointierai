import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Activity, FileText, Wallet, BarChart3, ArrowRight, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Locale } from '@/i18n/routing';

export const revalidate = 60;

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const tCommon = await getTranslations('common');

  const cards = [
    {
      href: '/dashboard/portfolio',
      icon: <Activity className="h-5 w-5 text-primary" />,
      title: locale === 'ja' ? 'ポートフォリオ AI 分析' : 'Portfolio AI Analysis',
      description: locale === 'ja' ? '保有銘柄のリスクスコアとアンロック影響予測' : 'Risk scoring and unlock impact prediction',
      badge: 'Pro',
    },
    {
      href: '/dashboard/tax',
      icon: <FileText className="h-5 w-5 text-gain" />,
      title: locale === 'ja' ? '税務レポート (確定申告)' : 'Tax Report',
      description: locale === 'ja' ? '雑所得計算・確定申告サマリー自動生成' : 'Auto-generated tax summary',
      badge: 'Pro',
      onlyJa: true,
    },
    {
      href: '/dashboard/wallet',
      icon: <Wallet className="h-5 w-5 text-tier-d" />,
      title: locale === 'ja' ? 'ウォレット連携' : 'Wallet Integration',
      description: locale === 'ja' ? 'Hyperliquid 取引履歴・Builder Fee 設定' : 'Hyperliquid history & Builder Fee',
      badge: 'Connect',
    },
    {
      href: '/dashboard/alerts',
      icon: <Bell className="h-5 w-5 text-primary" />,
      title: locale === 'ja' ? 'アラート設定' : 'Alerts',
      description: locale === 'ja' ? '価格・アンロック・IDO 通知' : 'Price / Unlock / IDO notifications',
      badge: 'Free',
    },
    {
      href: '/dashboard/watchlist',
      icon: <BarChart3 className="h-5 w-5 text-gain" />,
      title: locale === 'ja' ? 'ウォッチリスト' : 'Watchlist',
      description: locale === 'ja' ? 'お気に入り銘柄の一覧管理' : 'Manage favorite coins',
      badge: 'Free',
    },
  ].filter((c) => !c.onlyJa || locale === 'ja');

  return (
    <div className="container py-4 space-y-8">
      <header>
        <h1 className="text-xl md:text-2xl font-semibold">{tCommon('siteName')} Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === 'ja' ? 'AI による個人専用クリプト管理ハブ' : 'AI-powered personal crypto management hub'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-lg border border-border/60 bg-card/30 p-5 space-y-3 hover:border-primary/40 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-lg bg-muted/40">{c.icon}</div>
              <Badge variant={c.badge === 'Pro' ? 'default' : 'secondary'} className="text-[10px]">
                {c.badge}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{c.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
