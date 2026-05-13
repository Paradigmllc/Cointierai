import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Noto_Sans, Noto_Sans_JP, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { routing, type Locale, SUPPORTED_LOCALES } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Web3Provider } from '@/providers/Web3Provider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { TrackingBeacon } from '@/components/attribution/TrackingBeacon';
import { cn } from '@/lib/utils';

const notoSans = Noto_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

// Japanese / CJK glyph coverage — primary Asia market for Cointier
const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-jp',
  display: 'swap',
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: { default: t('title'), template: t('titleTemplate') },
    description: t('description'),
    alternates: {
      languages: Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
      siteName: 'Cointier',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeStr } = await params;

  if (!routing.locales.includes(localeStr as Locale)) {
    notFound();
  }
  const locale = localeStr as Locale;

  setRequestLocale(locale as Locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background text-foreground font-sans antialiased', notoSans.variable, notoSansJp.variable, jetbrainsMono.variable)}>
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Web3Provider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 pb-16 md:pb-0">{children}</main>
                <Footer />
              </div>
              <MobileBottomNav />
              <Toaster position="top-right" richColors />
              <TrackingBeacon />
            </Web3Provider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
