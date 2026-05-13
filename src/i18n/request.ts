import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';
import { notFound } from 'next/navigation';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale | undefined;

  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  try {
    return {
      locale,
      messages: (await import(`@/messages/${locale}.json`)).default,
      // 数値・日付フォーマットも locale 別に
      timeZone: locale === 'ja' ? 'Asia/Tokyo' : locale === 'ko' ? 'Asia/Seoul' : 'UTC',
      now: new Date(),
      formats: {
        dateTime: {
          short: { day: 'numeric', month: 'short', year: 'numeric' },
        },
        number: {
          precise: { maximumFractionDigits: 8 },
          compact: { notation: 'compact', compactDisplay: 'short' },
          percent: { style: 'percent', maximumFractionDigits: 2 },
        },
      },
    };
  } catch (error) {
    console.error(`Failed to load messages for locale "${locale}":`, error);
    notFound();
  }
});
