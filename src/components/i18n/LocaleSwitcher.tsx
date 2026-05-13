'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter, SUPPORTED_LOCALES, LOCALE_META, type Locale } from '@/i18n/routing';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const current = LOCALE_META[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending} className="gap-1.5">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{current.flag} {current.label}</span>
          <span className="sm:hidden">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Tier S</DropdownMenuLabel>
        {SUPPORTED_LOCALES.filter((l) => LOCALE_META[l].priority === 'S').map((l) => (
          <LocaleItem key={l} locale={l} current={locale} onSelect={switchLocale} />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Tier A</DropdownMenuLabel>
        {SUPPORTED_LOCALES.filter((l) => LOCALE_META[l].priority === 'A').map((l) => (
          <LocaleItem key={l} locale={l} current={locale} onSelect={switchLocale} />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Tier B</DropdownMenuLabel>
        {SUPPORTED_LOCALES.filter((l) => LOCALE_META[l].priority === 'B').map((l) => (
          <LocaleItem key={l} locale={l} current={locale} onSelect={switchLocale} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LocaleItem({ locale, current, onSelect }: { locale: Locale; current: Locale; onSelect: (l: Locale) => void }) {
  const meta = LOCALE_META[locale];
  const isActive = locale === current;
  return (
    <DropdownMenuItem
      onClick={() => onSelect(locale)}
      className={cn('flex items-center justify-between gap-2 cursor-pointer', isActive && 'bg-accent')}
    >
      <span className="flex items-center gap-2">
        <span className="text-base">{meta.flag}</span>
        <span>{meta.label}</span>
      </span>
      <span className="text-xs text-muted-foreground">{meta.enLabel}</span>
    </DropdownMenuItem>
  );
}
