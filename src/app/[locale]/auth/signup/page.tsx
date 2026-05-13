import { setRequestLocale, getTranslations } from 'next-intl/server';
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
  const tT = await getTranslations({ locale });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  return (
    <div className="container py-12 max-w-md">
      <div className="rounded-xl border border-border/60 bg-card/30 p-8 space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">{tCommon('siteName')}</span>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{tT('authSignup.createYourAccount')}</h1>
          <p className="text-sm text-muted-foreground">{tT('authSignup.freeAccessToAiAnalysis')}</p>
        </div>
        <AuthForm mode="signup" />
        <p className="text-sm text-center">
          <span className="text-muted-foreground">{tT('authSignup.alreadyHaveAnAccount')}</span>
          <Link href="/auth/login" className="text-primary hover:underline">
            {tT('authSignup.logIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
