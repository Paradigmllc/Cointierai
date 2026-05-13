/**
 * SSOT-first community panel. Reads cointier.community_stats.
 * Falls back to inline coin row values (lc_galaxy_score etc) when no row yet.
 */
import { Twitter, MessageSquare, Send, Users2 } from 'lucide-react';
import { getCommunityStats } from '@/lib/db/ssot-queries';
import { formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';

interface Props {
  coinId: string;
  fallback?: {
    galaxyScore: number | null;
    socialVolume24h: number | null;
    sentiment: number | null;
  };
  locale: 'ja' | 'en' | string;
}

export async function CommunityPanel({ coinId, fallback, locale }: Props) {
  const row = await getCommunityStats(coinId);
  const stats = row ?? {
    coin_id: coinId,
    twitter_followers: null,
    twitter_followers_change_7d: null,
    reddit_subscribers: null,
    telegram_members: null,
    discord_members: null,
    galaxy_score: fallback?.galaxyScore ?? null,
    alt_rank: null,
    social_volume_24h: fallback?.socialVolume24h ?? null,
    sentiment: fallback?.sentiment ?? null,
  };

  const tiles = [
    { icon: <Twitter className="h-3 w-3 text-[#1DA1F2]" />, label: 'Twitter', value: stats.twitter_followers, change: stats.twitter_followers_change_7d },
    { icon: <MessageSquare className="h-3 w-3 text-[#FF4500]" />, label: 'Reddit', value: stats.reddit_subscribers, change: null },
    { icon: <Send className="h-3 w-3 text-[#229ED9]" />, label: 'Telegram', value: stats.telegram_members, change: null },
    { icon: <Users2 className="h-3 w-3 text-[#5865F2]" />, label: 'Discord', value: stats.discord_members ?? null, change: null },
  ];
  const hasAny = tiles.some((t) => t.value != null) || stats.galaxy_score != null;
  if (!hasAny) return null;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading">{locale === 'ja' ? 'コミュニティ' : 'Community'}</h2>
        {stats.galaxy_score != null && (
          <span className="text-[10px] text-muted-foreground">LunarCRUSH Galaxy {stats.galaxy_score.toFixed(0)}/100</span>
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
      {(stats.social_volume_24h != null || stats.sentiment != null) && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
          {stats.social_volume_24h != null && (
            <div className="text-[11px]">
              <span className="text-muted-foreground">24h social posts: </span>
              <span className="num font-medium">{formatCompact(stats.social_volume_24h)}</span>
            </div>
          )}
          {stats.sentiment != null && (
            <div className="text-[11px] text-right">
              <span className="text-muted-foreground">Sentiment: </span>
              <span className={cn('num font-medium', stats.sentiment >= 0.5 ? 'text-gain' : 'text-loss')}>
                {formatPercent(stats.sentiment * 100, 1)}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
