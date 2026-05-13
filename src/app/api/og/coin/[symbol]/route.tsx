import { ImageResponse } from 'next/og';
import { getCoin } from '@/lib/db/queries';
import { formatPrice, formatCompact, formatPercent } from '@/lib/utils';

export const runtime = 'edge';

const TIER_COLORS = {
  S: '#FFD700',
  A: '#C0C0C0',
  B: '#CD7F32',
  C: '#9CA3AF',
  D: '#FB923C',
  F: '#EF4444',
} as const;

/**
 * Dynamic OG image for /coin/[symbol] — share に最適化
 *
 * 1200×630 PNG · "あなたの BTC は Tier S" 風バイラル設計
 */
export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const result = await getCoin(symbol).catch(() => null);

  if (!result) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0B0E16', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
        Cointier
      </div>,
      { width: 1200, height: 630 },
    );
  }

  const { coin } = result;
  const tierColor = coin.tier ? TIER_COLORS[coin.tier] : '#9CA3AF';
  const changeColor = (coin.change_24h ?? 0) >= 0 ? '#16C784' : '#EA3943';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0B0E16 0%, #171B25 100%)',
          color: '#fff',
          padding: 60,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Cointier</div>
          <div style={{ fontSize: 18, color: '#82878F', marginLeft: 'auto' }}>
            Asia's AI Crypto Intelligence
          </div>
        </div>

        {/* Coin name + symbol + rank */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: '-0.03em' }}>{coin.name}</div>
          <div style={{ fontSize: 48, color: '#82878F', textTransform: 'uppercase' }}>{coin.symbol}</div>
          {coin.rank && (
            <div style={{ fontSize: 28, color: '#82878F', marginLeft: 'auto' }}>#{coin.rank}</div>
          )}
        </div>

        {/* Tier Badge huge */}
        {coin.tier && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 24 }}>
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 20,
                border: `4px solid ${tierColor}`,
                background: `${tierColor}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 96,
                fontWeight: 900,
                color: tierColor,
                fontFamily: 'monospace',
              }}
            >
              {coin.tier}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 24, color: '#82878F' }}>Cointier Tier</div>
              {coin.tier_score && (
                <div style={{ fontSize: 56, fontWeight: 700, color: tierColor }}>
                  {coin.tier_score.toFixed(1)} / 100
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom row: price + change */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, color: '#82878F' }}>Price</div>
            <div style={{ fontSize: 60, fontWeight: 800 }}>{formatPrice(coin.price_usd)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 20, color: '#82878F' }}>24h</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: changeColor }}>
              {formatPercent(coin.change_24h)}
            </div>
            <div style={{ fontSize: 18, color: '#82878F', marginTop: 4 }}>
              MC {formatCompact(coin.market_cap_usd)}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
