/**
 * Locale-driven currency + domestic-region helpers.
 *
 * Concept:
 *   - DB / API data is canonical in USD (CoinGecko default).
 *   - Display layer converts USD → locale currency using a cached
 *     exchange-rate snapshot (CoinGecko /exchange_rates, BTC-anchored).
 *   - Each locale also implies a "domestic region" (ja → JP, ko → KR, …)
 *     so the JpExchanges-style section can re-target itself automatically.
 *
 * Why not store per-locale prices in DB? Rates drift continuously; keeping
 * USD as the only source of truth means a single table row stays valid for
 * every locale, and we just re-render on rate refresh (5-min ISR cache).
 */

export type Locale = 'ja' | 'en' | 'th' | 'vi' | 'id' | 'zh-TW' | 'ko';

interface LocaleSpec {
  currency: string;
  /** 2-letter ISO country code for "domestic" exchange filtering. en uses 'GLOBAL'. */
  region: 'JP' | 'US' | 'TH' | 'VN' | 'ID' | 'TW' | 'KR' | 'GLOBAL';
  /** BCP-47 tag for Intl.NumberFormat. */
  intlLocale: string;
  /** Whether to drop fractional units in display (JPY/VND/IDR/KRW). */
  zeroFraction: boolean;
}

const LOCALE_SPEC: Record<Locale, LocaleSpec> = {
  ja: { currency: 'JPY', region: 'JP', intlLocale: 'ja-JP', zeroFraction: true },
  en: { currency: 'USD', region: 'GLOBAL', intlLocale: 'en-US', zeroFraction: false },
  th: { currency: 'THB', region: 'TH', intlLocale: 'th-TH', zeroFraction: false },
  vi: { currency: 'VND', region: 'VN', intlLocale: 'vi-VN', zeroFraction: true },
  id: { currency: 'IDR', region: 'ID', intlLocale: 'id-ID', zeroFraction: true },
  'zh-TW': { currency: 'TWD', region: 'TW', intlLocale: 'zh-TW', zeroFraction: false },
  ko: { currency: 'KRW', region: 'KR', intlLocale: 'ko-KR', zeroFraction: true },
};

export function localeSpec(locale: string): LocaleSpec {
  return LOCALE_SPEC[locale as Locale] ?? LOCALE_SPEC.en;
}

export function localeCurrency(locale: string): string {
  return localeSpec(locale).currency;
}

export function localeRegion(locale: string): LocaleSpec['region'] {
  return localeSpec(locale).region;
}

/** Fallback rates — used when /exchange_rates fetch fails. Updated 2026-05. */
const FALLBACK_USD_TO: Record<string, number> = {
  USD: 1,
  JPY: 156,
  THB: 36,
  VND: 25500,
  IDR: 16200,
  TWD: 32.5,
  KRW: 1380,
};

export type RatesMap = Record<string, number>;

/**
 * Convert a USD amount into the locale's currency, returning a number.
 * Returns the original USD value when the rate is missing (safer than zero).
 */
export function convertUsd(usd: number, locale: string, rates: RatesMap): number {
  const cur = localeCurrency(locale);
  const rate = rates[cur] ?? FALLBACK_USD_TO[cur] ?? 1;
  return usd * rate;
}

/**
 * High-density Intl-formatted local price.
 *   - JPY/VND/IDR/KRW drop fractional units (e.g. ¥15,234,567).
 *   - Sub-currency-unit prices switch to 4 sig figs (e.g. ¥0.0123).
 */
export function formatLocalPrice(usd: number | null | undefined, locale: string, rates: RatesMap): string {
  if (usd == null || !Number.isFinite(usd)) return '—';
  const spec = localeSpec(locale);
  const local = convertUsd(usd, locale, rates);
  const abs = Math.abs(local);
  if (abs >= 1 || spec.zeroFraction) {
    return new Intl.NumberFormat(spec.intlLocale, {
      style: 'currency',
      currency: spec.currency,
      maximumFractionDigits: spec.zeroFraction ? 0 : 2,
      minimumFractionDigits: spec.zeroFraction ? 0 : 2,
    }).format(local);
  }
  // Sub-unit precision for small caps.
  return new Intl.NumberFormat(spec.intlLocale, {
    style: 'currency',
    currency: spec.currency,
    maximumFractionDigits: abs >= 0.01 ? 4 : 6,
    minimumFractionDigits: abs >= 0.01 ? 4 : 6,
  }).format(local);
}

/**
 * Compact local-currency formatting — preserves Intl currency symbol while
 * abbreviating large values (¥1.23兆 / $1.23T / ₩1.23조-style depending on Intl).
 * Falls back to a custom T/B/M/K when Intl's compact-currency notation is
 * unavailable in the runtime.
 */
export function formatLocalCompact(usd: number | null | undefined, locale: string, rates: RatesMap): string {
  if (usd == null || !Number.isFinite(usd)) return '—';
  const spec = localeSpec(locale);
  const local = convertUsd(usd, locale, rates);
  try {
    return new Intl.NumberFormat(spec.intlLocale, {
      style: 'currency',
      currency: spec.currency,
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(local);
  } catch {
    const sign = local < 0 ? '-' : '';
    const abs = Math.abs(local);
    const symbol = (0).toLocaleString(spec.intlLocale, { style: 'currency', currency: spec.currency }).replace(/[\d.,\s]/g, '');
    if (abs >= 1e12) return `${sign}${symbol}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${symbol}${(abs / 1e3).toFixed(2)}K`;
    return `${sign}${symbol}${abs.toFixed(2)}`;
  }
}
