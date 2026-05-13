import { ImageResponse } from 'next/og';
import { getCoin } from '@/lib/db/queries';
import { formatCompact } from '@/lib/utils';

export const runtime = 'edge';

/**
 * Dynamic OG image for /compare/[a]-vs-[b].
 *
 * 1200×630 PNG built with Satori (server-side React). Tuned for SNS shares —
 * the "VS" centerpiece is the social hook (works in 7 languages, no text
 * localisation needed beyond the locale segment of the URL).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const m = pair.match(/^(.+?)-vs-(.+)$/);
  const aId = m?.[1];
  const bId = m?.[2];
  const [resA, resB] = await Promise.all([
    aId ? getCoin(aId).catch(() => null) : null,
    bId ? getCoin(bId).catch(() => null) : null,
  ]);
  const a = resA?.coin;
  const b = resB?.coin;
  if (!a || !b) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#050914', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
        Cointier
      </div>,
      { width: 1200, height: 630 },
    );
  }
  const winner = (a.market_cap_usd ?? 0) > (b.market_cap_usd ?? 0) ? 'a' : 'b';
  return new ImageResponse(
    (
      <div style={{
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #050914 0%, #0F172A 50%, #050914 100%)',
        color: '#F1F5F9',
        padding: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 28, fontWeight: 700, color: '#5EEAFF' }}>
            ✦ Cointier
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 18, color: '#94A3B8' }}>Side-by-side comparison</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 60 }}>
          <CoinCard coin={a} winner={winner === 'a'} side="left" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              fontSize: 96, fontWeight: 900, lineHeight: 1,
              background: 'linear-gradient(135deg, #06D6A0 0%, #00D4FF 50%, #8B85FF 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}>VS</div>
            <div style={{ fontSize: 16, color: '#5EEAFF' }}>AI verdict inside →</div>
          </div>
          <CoinCard coin={b} winner={winner === 'b'} side="right" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, color: '#64748B' }}>
          <span>cointier.ai/compare/{pair}</span>
          <span>Asia&apos;s AI-powered crypto intelligence</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function CoinCard({ coin, winner, side }: { coin: { name: string; symbol: string; image_url: string | null; market_cap_usd: number | null; tier: string | null }; winner: boolean; side: 'left' | 'right' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      padding: 32,
      borderRadius: 24,
      border: winner ? '2px solid #5EEAFF' : '2px solid rgba(94, 234, 255, 0.2)',
      background: winner ? 'rgba(94, 234, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
      minWidth: 320,
    }}>
      {coin.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coin.image_url} alt={coin.symbol} width={96} height={96} style={{ borderRadius: '50%' }} />
      )}
      <div style={{ fontSize: 36, fontWeight: 700 }}>{coin.name}</div>
      <div style={{ fontSize: 18, color: '#94A3B8', textTransform: 'uppercase' }}>{coin.symbol}</div>
      {coin.tier && (
        <div style={{
          padding: '4px 16px', borderRadius: 999, fontSize: 18, fontWeight: 700,
          background: 'rgba(255, 215, 0, 0.15)', color: '#FFD700',
        }}>Tier {coin.tier}</div>
      )}
      {coin.market_cap_usd && (
        <div style={{ fontSize: 22, color: '#5EEAFF', fontWeight: 600 }}>
          ${formatCompact(coin.market_cap_usd)}
        </div>
      )}
    </div>
  );
}
