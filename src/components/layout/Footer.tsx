import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const DATA_SOURCES = [
  { name: 'CoinGecko', url: 'https://www.coingecko.com' },
  { name: 'CryptoRank', url: 'https://cryptorank.io' },
  { name: 'DeFiLlama', url: 'https://defillama.com' },
  { name: 'DEXScreener', url: 'https://dexscreener.com' },
  { name: 'RootData', url: 'https://www.rootdata.com' },
  { name: 'Token Terminal', url: 'https://tokenterminal.com' },
  { name: 'Hyperliquid', url: 'https://hyperliquid.xyz' },
];

export function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');

  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container py-12 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-bold">{tCommon('siteName')}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">{t('tagline')}</p>
            <p className="text-xs text-muted-foreground/80 max-w-xs">{t('disclaimer')}</p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/coins" className="hover:text-foreground transition-colors">{tNav('coins')}</Link></li>
              <li><Link href="/vcs" className="hover:text-foreground transition-colors">{tNav('vcs')}</Link></li>
              <li><Link href="/ido" className="hover:text-foreground transition-colors">{tNav('ido')}</Link></li>
              <li><Link href="/unlocks" className="hover:text-foreground transition-colors">{tNav('unlocks')}</Link></li>
              <li><Link href="/tools" className="hover:text-foreground transition-colors">{tNav('tools')}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">{tNav('pricing')}</Link></li>
              <li><Link href="/docs" className="hover:text-foreground transition-colors">{tNav('docs')}</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">{t('about')}</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">{t('terms')}</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">{t('privacy')}</Link></li>
            </ul>
          </div>
        </div>

        <Separator />

        {/* Data attribution (規約遵守必須) */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t('dataProvidedBy')}:</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {DATA_SOURCES.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground">
          {t('copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
