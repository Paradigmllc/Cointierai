import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  localExchangesForLocale,
  localExchangesHeading,
  regionForLocale,
} from '@/lib/local-exchanges';
import type { CgTicker } from '@/lib/api/coingecko';

interface LocalExchangesProps {
  /** Live tickers from CoinGecko — used to compute per-exchange availability. */
  tickers: CgTicker[];
  locale: string;
}

/**
 * Locale-aware "local exchanges" panel. Replaces the JP-hardcoded section
 * so each locale sees its own domestic exchange grid:
 *   ja → JP (bitFlyer / Coincheck / GMO / bitbank …)
 *   ko → KR (Upbit / Bithumb / Korbit / Coinone / GOPAX)
 *   th → TH (Bitkub / Satang / Zipmex …)
 *   vi → VN (ONUS / Remitano …)
 *   id → ID (Indodax / Tokocrypto / Pintu …)
 *   zh-TW → TW (MAX / BitoPro …)
 *   en → GLOBAL (Coinbase / Kraken / Bitstamp / Gemini …)
 *
 * Availability is driven by the live tickers payload — a tile lights up
 * green when CoinGecko reports an active market on that venue, gray otherwise.
 */
export function LocalExchanges({ tickers, locale }: LocalExchangesProps) {
  const exchanges = localExchangesForLocale(locale);
  const heading = localExchangesHeading(locale);
  const region = regionForLocale(locale);

  const availableIds = new Set(tickers.map((t) => t.market.identifier));
  const availableCount = exchanges.filter((ex) => availableIds.has(ex.cgId)).length;

  const tagByLocale: Record<string, { available: string; unavailable: string }> = {
    ja: { available: '取引所で利用可能', unavailable: '国内未上場' },
    ko: { available: '거래소에서 이용 가능', unavailable: '국내 미상장' },
    th: { available: 'ตลาดรองรับ', unavailable: 'ยังไม่จดทะเบียนในประเทศ' },
    vi: { available: 'sàn hỗ trợ', unavailable: 'Chưa niêm yết trong nước' },
    id: { available: 'bursa mendukung', unavailable: 'Belum tersedia di bursa lokal' },
    'zh-TW': { available: '個交易所支援', unavailable: '尚未在台上架' },
    en: { available: 'global venues available', unavailable: 'No global majors listed' },
  };
  const tag = tagByLocale[locale] ?? tagByLocale.en;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="section-heading flex items-center gap-2">
          <span aria-hidden>{heading.flag}</span>
          {heading.heading}
          <Badge variant="outline" className="text-[9px] py-0">{region}</Badge>
        </h2>
        {availableCount > 0 ? (
          <Badge variant="secondary" className="text-[10px] bg-gain/10 text-gain border-gain/30">
            {availableCount} {tag.available}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            {tag.unavailable}
          </Badge>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{heading.subline}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {exchanges.map((ex) => {
          const available = availableIds.has(ex.cgId);
          return (
            <a
              key={ex.cgId}
              href={available ? ex.url : undefined}
              target={available ? '_blank' : undefined}
              rel={available ? 'noopener noreferrer' : undefined}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border text-[12px] transition-colors',
                available
                  ? 'border-gain/40 bg-gain/[0.04] hover:bg-gain/10 text-foreground'
                  : 'border-border bg-subtle text-muted-foreground/60',
              )}
            >
              {available ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-gain shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span className="truncate flex-1">{ex.name}</span>
              {ex.regulated && available && (
                <ShieldCheck className="h-3 w-3 text-gain/70 shrink-0" aria-label="Regulated" />
              )}
            </a>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-border/50">
        {locale === 'ja'
          ? '※ 取扱銘柄は変動します。最新情報は各取引所サイトで必ずご確認ください。'
          : '※ Listings change. Always confirm the latest status on the exchange website.'}
      </p>
    </section>
  );
}
