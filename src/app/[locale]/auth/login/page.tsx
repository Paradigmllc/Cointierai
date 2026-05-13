import { setRequestLocale } from 'next-intl/server';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { redirect } = await searchParams;
  setRequestLocale(locale);
  return <LoginPageInner locale={locale} redirectTo={redirect} />;
}

function LoginPageInner({ locale, redirectTo }: { locale: Locale; redirectTo?: string }) {
  const tCommon = useTranslations('common');
  return (
    <div className="container py-12 max-w-md">
      <div className="rounded-xl border border-border/60 bg-card/30 p-8 space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">{tCommon('siteName')}</span>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{locale === 'ja' ? 'ログイン' : 'Welcome back'}</h1>
          <p className="text-sm text-muted-foreground">
            {locale === 'ja' ? 'アジアの AI クリプトインテリジェンス' : "Asia's AI crypto intelligence"}
          </p>
        </div>
        <AuthForm mode="login" redirectTo={redirectTo} />
        <p className="text-sm text-center">
          <span className="text-muted-foreground">{locale === 'ja' ? 'アカウントをお持ちでない方は ' : 'No account? '}</span>
          <Link href="/auth/signup" className="text-primary hover:underline">
            {locale === 'ja' ? '新規登録' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
