import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignupPage({ params }: PageProps) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  return <SignupInner locale={locale} />;
}

function SignupInner({ locale }: { locale: Locale }) {
  const tCommon = useTranslations('common');
  return (
    <div className="container py-12 max-w-md">
      <div className="rounded-xl border border-border/60 bg-card/30 p-8 space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">{tCommon('siteName')}</span>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{locale === 'ja' ? '新規登録' : 'Create your account'}</h1>
          <p className="text-sm text-muted-foreground">
            {locale === 'ja' ? '無料で 37,000 銘柄の AI 分析にアクセス' : 'Free access to AI analysis for 37,000+ coins'}
          </p>
        </div>
        <AuthForm mode="signup" />
        <p className="text-sm text-center">
          <span className="text-muted-foreground">{locale === 'ja' ? '既にアカウントをお持ちですか? ' : 'Already have an account? '}</span>
          <Link href="/auth/login" className="text-primary hover:underline">
            {locale === 'ja' ? 'ログイン' : 'Log in'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
