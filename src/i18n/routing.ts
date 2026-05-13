import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * Cointier i18n routing 設定
 *
 * 言語戦略 (Notion 設計書反映):
 * - Tier S: ja, en (M1 同時リリース)
 * - Tier A: th, vi, id (M3-M6)
 * - Tier B: zh-TW, ko (M6-M12)
 *
 * Locale slug は ISO 639-1 / BCP 47 準拠
 */
export const SUPPORTED_LOCALES = ['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_META: Record<
  Locale,
  {
    label: string; // native script display name
    enLabel: string;
    flag: string;
    region: string;
    priority: 'S' | 'A' | 'B';
  }
> = {
  ja: { label: '日本語', enLabel: 'Japanese', flag: '🇯🇵', region: 'JP', priority: 'S' },
  en: { label: 'English', enLabel: 'English', flag: '🇺🇸', region: 'GLOBAL', priority: 'S' },
  th: { label: 'ไทย', enLabel: 'Thai', flag: '🇹🇭', region: 'TH', priority: 'A' },
  vi: { label: 'Tiếng Việt', enLabel: 'Vietnamese', flag: '🇻🇳', region: 'VN', priority: 'A' },
  id: { label: 'Bahasa Indonesia', enLabel: 'Indonesian', flag: '🇮🇩', region: 'ID', priority: 'A' },
  'zh-TW': { label: '繁體中文', enLabel: 'Chinese (Traditional)', flag: '🇹🇼', region: 'TW', priority: 'B' },
  ko: { label: '한국어', enLabel: 'Korean', flag: '🇰🇷', region: 'KR', priority: 'B' },
};

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: 'ja',
  // SEO: prefix-as-needed で /ja/ も明示的にする (canonical URL を多言語で別個に持つ)
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
