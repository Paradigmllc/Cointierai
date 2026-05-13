'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Sparkles, Menu, X } from 'lucide-react';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { AuthButton } from '@/components/auth/AuthButton';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { cn } from '@/lib/utils';

/**
 * Header — Cointier global navigation.
 * Stripe-inspired clean dashboard: white surface, hairline border, soft shadow on scroll.
 *
 * Desktop: [Logo] [primary nav]                          [Search] [Theme] [Locale] [Wallet] [Auth]
 * Mobile:  [Hamburger] [Logo]                                                   [Theme] [Auth]
 */
export function Header() {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/coins', key: 'coins' },
    { href: '/exchanges', key: 'exchanges' },
    { href: '/vcs', key: 'vcs' },
    { href: '/ido', key: 'ido' },
    { href: '/unlocks-calendar', key: 'unlocks' },
    { href: '/news', key: 'news' },
    { href: '/yields', key: 'yields' },
    { href: '/pricing', key: 'pricing' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 shadow-soft">
      <div className="container flex h-16 items-center gap-2 md:gap-4">
        {/* Mobile hamburger */}
        <button
          aria-label="Open menu"
          className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-bold text-base tracking-tight">{tCommon('siteName')}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 text-[13px] font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {tNav(link.key)}
            </Link>
          ))}
        </nav>

        {/* Desktop search */}
        <div className="flex-1 max-w-sm ml-auto hidden lg:block">
          <GlobalSearch />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1 shrink-0 ml-auto lg:ml-0">
          <ThemeToggle />
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          <div className="hidden md:block">
            <ConnectWalletButton autoOpenBuilderFee={true} />
          </div>
          <AuthButton />
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'md:hidden border-t border-border/60 bg-background overflow-hidden transition-all',
          mobileOpen ? 'max-h-[400px]' : 'max-h-0',
        )}
      >
        <nav className="container py-3 flex flex-col gap-1 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="px-3 py-2 rounded-md text-foreground hover:bg-accent transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {tNav(link.key)}
            </Link>
          ))}
          <div className="flex items-center gap-2 pt-2 mt-1 border-t border-border/40">
            <LocaleSwitcher />
            <ConnectWalletButton autoOpenBuilderFee={false} />
          </div>
          {/* Mobile search */}
          <div className="pt-1">
            <GlobalSearch triggerClassName="inline-flex items-center gap-2 h-9 w-full rounded-md border border-border bg-card pl-9 pr-2 text-[12px] text-muted-foreground hover:bg-accent transition-colors relative" />
          </div>
        </nav>
      </div>
    </header>
  );
}
