'use client';

import { Twitter, MessageSquare, Send, Users2 } from 'lucide-react';
import { formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';

interface Props {
  twitter: number | null;
  twitterChange?: number | null;
  reddit: number | null;
  redditChange?: number | null;
  telegram: number | null;
  discord?: number | null;
  galaxyScore?: number | null;
  socialVolume24h?: number | null;
  sentiment?: number | null;
  locale: 'ja' | 'en' | string;
}

export function CommunityPanel(p: Props) {
  const tiles = [
    { icon: <Twitter className="h-3 w-3 text-[#1DA1F2]" />, label: 'Twitter', value: p.twitter, change: p.twitterChange },
    { icon: <MessageSquare className="h-3 w-3 text-[#FF4500]" />, label: 'Reddit', value: p.reddit, change: p.redditChange },
    { icon: <Send className="h-3 w-3 text-[#229ED9]" />, label: 'Telegram', value: p.telegram },
    { icon: <Users2 className="h-3 w-3 text-[#5865F2]" />, label: 'Discord', value: p.discord ?? null },
  ];
  const hasAny = tiles.some((t) => t.value != null) || p.galaxyScore != null;
  if (!hasAny) return null;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading">{p.locale === 'ja' ? 'コミュニティ' : 'Community'}</h2>
        {p.galaxyScore != null && (
          <span className="text-[10px] text-muted-foreground">LunarCRUSH Galaxy {p.galaxyScore.toFixed(0)}/100</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-border bg-subtle p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {t.icon}{t.label}
            </div>
            <div className="text-[14px] font-semibold tabular-nums">{t.value != null ? formatCompact(t.value) : '—'}</div>
            {t.change != null && (
              <div className={cn('text-[10px] tabular-nums', changeColor(t.change))}>
                {t.change >= 0 ? '+' : ''}{formatPercent(t.change, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
      {(p.socialVolume24h != null || p.sentiment != null) && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
          {p.socialVolume24h != null && (
            <div className="text-[11px]">
              <span className="text-muted-foreground">24h social posts: </span>
              <span className="num font-medium">{formatCompact(p.socialVolume24h)}</span>
            </div>
          )}
          {p.sentiment != null && (
            <div className="text-[11px] text-right">
              <span className="text-muted-foreground">Sentiment: </span>
              <span className={cn('num font-medium', p.sentiment >= 0.5 ? 'text-gain' : 'text-loss')}>
                {formatPercent(p.sentiment * 100, 1)}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
