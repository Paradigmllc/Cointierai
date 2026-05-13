'use client';

/**
 * Mobile bottom navigation — fixed at the viewport bottom on small screens.
 *
 * Five primary destinations chosen by reach × monetisation value:
 *   - Coins (everyone)
 *   - DEX (active traders)
 *   - News (return-visit driver)
 *   - Tools (Aha Moment funnel)
 *   - Account (settings / login)
 *
 * Hidden on `md+` viewports — desktop has the full Header nav already.
 */
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Coins, Droplet, Newspaper, Sparkles, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/coins', icon: Coins, label: 'Coins' },
  { href: '/dex', icon: Droplet, label: 'DEX' },
  { href: '/news', icon: Newspaper, label: 'News' },
  { href: '/tools', icon: Sparkles, label: 'Tools' },
  { href: '/dashboard', icon: UserCircle, label: 'Me' },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname() ?? '';
  const locale = useLocale();
  return (
    <nav
      aria-label="Mobile primary navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-md pb-safe"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-stretch justify-around max-w-md mx-auto">
        {ITEMS.map((it) => {
          const href = `/${locale}${it.href}`;
          const active = pathname === href || pathname.startsWith(href + '/');
          const Icon = it.icon;
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
