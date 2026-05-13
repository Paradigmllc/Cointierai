import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Search, Sparkles } from 'lucide-react';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { AuthButton } from '@/components/auth/AuthButton';
import { Input } from '@/components/ui/input';

export function Header() {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');

  const navLinks = [
    { href: '/', key: 'home' },
    { href: '/coins', key: 'coins' },
    { href: '/vcs', key: 'vcs' },
    { href: '/ido', key: 'ido' },
    { href: '/unlocks', key: 'unlocks' },
    { href: '/tools', key: 'tools' },
    { href: '/pricing', key: 'pricing' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-bold text-base tracking-tight">{tCommon('siteName')}</span>
        </Link>

        {/* Primary nav (desktop) */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
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

        {/* Search */}
        <div className="flex-1 max-w-md ml-auto hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={tCommon('searchPlaceholder')}
              aria-label={tCommon('search')}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Right cluster: locale / wallet / auth */}
        <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
          <LocaleSwitcher />
          <ConnectWalletButton autoOpenBuilderFee={true} />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
