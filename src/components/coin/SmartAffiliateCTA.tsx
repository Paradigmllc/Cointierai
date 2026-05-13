'use client';

/**
 * SmartAffiliateCTA — replaces the legacy single-button CTA.
 *
 * Features:
 *   1. Top-3 ranked exchanges shown inline (Tier S → A) with bonus badges.
 *   2. "All available exchanges" disclosure for the long tail (uses <details>).
 *   3. Region-aware filtering via selectAffiliates(locale).
 *   4. PR badge + 投資推奨ではない disclosure (景表法準拠).
 *
 * Each click goes through /go/[code]?coin={symbol} for click attribution
 * (S2S Trinity per CLAUDE.md §S2S).
 */
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, ChevronDown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { selectAffiliates } from '@/lib/exchanges/affiliate-catalog';
import { cn } from '@/lib/utils';

interface Props {
  coinSymbol: string;
  /** Hide on coins that don't have CEX listings (DEX-only) — pass false to suppress. */
  enabled?: boolean;
}

export function SmartAffiliateCTA({ coinSymbol, enabled = true }: Props) {
  const locale = useLocale();
  const t = useTranslations();
  if (!enabled) return null;
  const partners = selectAffiliates(locale);
  if (partners.length === 0) return null;

  const tierS = partners.filter((p) => p.tier === 'S');
  const tierA = partners.filter((p) => p.tier === 'A');
  const tierB = partners.filter((p) => p.tier === 'B');
  const featured = [...tierS, ...tierA].slice(0, 3);
  const rest = partners.filter((p) => !featured.includes(p));

  const tagline = (p: (typeof partners)[number]) => (locale === 'ja' ? p.tagline.ja : p.tagline.en);
  const bonus = (p: (typeof partners)[number]) => (p.bonus ? (locale === 'ja' ? p.bonus.ja : p.bonus.en) : null);

  return (
    <section className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4 space-y-3">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('affCta.availableExchanges')}
        </h3>
        <Badge variant="secondary" className="text-[10px]">PR</Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {featured.map((p, i) => (
          <a
            key={p.code}
            href={`/go/${p.code}?coin=${encodeURIComponent(coinSymbol)}&locale=${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'rounded-lg border bg-card p-3 space-y-1.5 transition-all hover:shadow-card hover:-translate-y-px',
              i === 0 ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[13px]">{p.label}</span>
              {p.tier === 'S' && (
                <Badge className="bg-tier-s/10 text-tier-s border-tier-s/30 text-[9px] gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-current" /> Tier S
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 min-h-[26px]">
              {tagline(p)}
            </p>
            {bonus(p) && (
              <Badge variant="secondary" className="text-[9px] bg-gain/10 text-gain border-gain/30">
                🎁 {bonus(p)}
              </Badge>
            )}
            <div className="text-[10px] text-primary font-medium">
              {t('affCta.continueToExchange')} →
            </div>
          </a>
        ))}
      </div>

      {rest.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 select-none">
            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
            {locale === 'ja' ? `他 ${rest.length} 取引所を表示` : `Show ${rest.length} more exchanges`}
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
            {rest.map((p) => (
              <a
                key={p.code}
                href={`/go/${p.code}?coin=${encodeURIComponent(coinSymbol)}&locale=${locale}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-border bg-subtle px-2 py-1.5 text-[11px] hover:border-primary hover:text-primary transition-colors text-center"
              >
                {p.label}
                {bonus(p) && <div className="text-[9px] text-muted-foreground mt-0.5">🎁 {bonus(p)}</div>}
              </a>
            ))}
          </div>
          {tierB.length > 0 && (
            <p className="text-[9px] text-muted-foreground/60 mt-2">
              {locale === 'ja' ? 'ハードウェアウォレット含む' : 'Includes hardware wallets'}
            </p>
          )}
        </details>
      )}

      <p className="text-[10px] text-muted-foreground/80">
        {t('affCta.containsAffiliateLinksNotInvestment')}
      </p>
    </section>
  );
}
