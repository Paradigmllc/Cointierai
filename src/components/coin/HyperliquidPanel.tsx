'use client';

import { useState } from 'react';
import { Zap, ExternalLink, Activity, TrendingUp, Layers, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BuilderFeeModal } from '@/components/wallet/BuilderFeeModal';
import { formatCompact, formatPrice, cn } from '@/lib/utils';

interface HyperliquidPanelProps {
  symbol: string;
  isListed: boolean;
  markPrice?: number | null;
  oiUsd?: number | null;
  volume24hUsd?: number | null;
  fundingRate8h?: number | null;
  maxLeverage?: number | null;
  locale: string;
}

const BUILDER_FEE_BPS = 35; // 0.035 %

/**
 * Hyperliquid perps panel + Builder Fee approval CTA.
 * - Surfaces mark price, OI, 24h volume, funding rate, max leverage.
 * - "Approve Builder Fee" button opens the existing BuilderFeeModal so a
 *   user can sign the EIP-712 approval inline from the coin page.
 * - "Open in Hyperliquid" deep-link for users who already approved.
 * - Includes a 60-second perpetuals primer block tailored per-locale.
 */
export function HyperliquidPanel({
  symbol,
  isListed,
  markPrice,
  oiUsd,
  volume24hUsd,
  fundingRate8h,
  maxLeverage,
  locale,
}: HyperliquidPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isJa = locale === 'ja';

  if (!isListed) {
    return (
      <section className="surface p-5 space-y-2">
        <h2 className="section-heading flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Hyperliquid Perps
          <Badge variant="outline" className="text-[9px] py-0">Not listed</Badge>
        </h2>
        <p className="text-[12px] text-muted-foreground">
          {isJa
            ? `${symbol.toUpperCase()} は現在 Hyperliquid に上場していません。Cointier はアジア圏で初の Builder Fee 統合プレイヤーで、対応銘柄を継続的に拡大しています。`
            : `${symbol.toUpperCase()} is not currently listed on Hyperliquid. Cointier is the first Asia-native venue with Builder Fee integration — coverage is expanding continuously.`}
        </p>
      </section>
    );
  }

  // Funding rate normalized to APR for display.
  const fundingApr = fundingRate8h != null ? fundingRate8h * 3 * 365 * 100 : null;
  const fundingDirection = fundingRate8h != null ? (fundingRate8h >= 0 ? 'long_pays' : 'short_pays') : null;

  return (
    <section className="surface p-5 space-y-5 relative overflow-hidden">
      {/* Decorative gradient corner — luxury accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(99,91,255,0.4), transparent 70%)' }}
      />

      <div className="relative flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <h2 className="section-heading flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Hyperliquid Perps
            <Badge className="text-[9px] py-0 bg-primary/15 text-primary border-primary/30">Live</Badge>
            {maxLeverage && (
              <Badge variant="outline" className="text-[9px] py-0">
                {maxLeverage}× max leverage
              </Badge>
            )}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {isJa
              ? '永続的にオンチェーン送金される Builder Fee 0.035% の対象銘柄'
              : 'On-chain Builder Fee 0.035% revenue share applies to this market.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="shadow-soft gap-1.5"
          >
            <Zap className="h-3.5 w-3.5" />
            {isJa ? 'Builder Fee 承認' : 'Approve Builder Fee'}
          </Button>
          <a
            href={`https://app.hyperliquid.xyz/trade/${symbol.toUpperCase()}`}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-[12px] font-medium hover:bg-accent transition-colors"
          >
            {isJa ? 'Hyperliquid で取引' : 'Trade on Hyperliquid'}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Stat grid */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={<TrendingUp className="h-3.5 w-3.5 text-primary" />}
          label={isJa ? 'マーク価格' : 'Mark price'}
          value={markPrice ? formatPrice(markPrice) : '—'}
        />
        <StatTile
          icon={<Layers className="h-3.5 w-3.5 text-tier-a" />}
          label={isJa ? '建玉 (USD)' : 'Open Interest'}
          value={oiUsd ? formatCompact(oiUsd) : '—'}
        />
        <StatTile
          icon={<Activity className="h-3.5 w-3.5 text-gain" />}
          label={isJa ? '24h 取引高' : '24h Volume'}
          value={volume24hUsd ? formatCompact(volume24hUsd) : '—'}
        />
        <StatTile
          icon={<Zap className="h-3.5 w-3.5 text-tier-d" />}
          label={isJa ? '資金調達率 (年率)' : 'Funding APR'}
          value={fundingApr != null ? `${fundingApr.toFixed(2)}%` : '—'}
          sub={
            fundingDirection === 'long_pays'
              ? isJa ? 'ロング→ショート支払' : 'longs pay shorts'
              : fundingDirection === 'short_pays'
                ? isJa ? 'ショート→ロング支払' : 'shorts pay longs'
                : undefined
          }
          valueClass={fundingDirection === 'long_pays' ? 'text-loss' : fundingDirection === 'short_pays' ? 'text-gain' : ''}
        />
      </div>

      {/* Builder Fee explainer */}
      <div className="relative rounded-lg border border-primary/20 bg-primary/[0.03] p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-[12px] font-medium">
          <Zap className="h-3.5 w-3.5 text-primary" />
          {isJa ? 'Builder Fee とは' : 'What is the Builder Fee?'}
        </div>
        <ol className="space-y-1 text-[11px] text-muted-foreground">
          <BfStep>
            {isJa
              ? `あなたがウォレットを接続し、EIP-712 で ${(BUILDER_FEE_BPS / 100).toFixed(3)}% を一度承認する`
              : `Connect your wallet and sign an EIP-712 approving ${(BUILDER_FEE_BPS / 100).toFixed(3)}% once`}
          </BfStep>
          <BfStep>
            {isJa
              ? '以後 Hyperliquid で取引するたびに、その手数料の一部が Cointier に自動で送金される'
              : 'On every subsequent Hyperliquid trade, a portion of your fee routes to Cointier on-chain'}
          </BfStep>
          <BfStep>
            {isJa
              ? 'ユーザーが明示的に解除しない限り永続。資金はあなたのウォレットに残り、非カストディアル'
              : 'Permanent until explicit revoke. Funds stay in your wallet — fully non-custodial'}
          </BfStep>
        </ol>
        <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-primary/20">
          {isJa
            ? '※ Builder Fee はスマートコントラクトが保証 (Hyperliquid 公式機能) · 投資推奨ではありません'
            : '※ Builder Fee is enforced by the Hyperliquid smart contract · Not investment advice'}
        </p>
      </div>

      <BuilderFeeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onApproved={() => setModalOpen(false)}
        locale={locale as 'ja' | 'en'}
      />
    </section>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-subtle p-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {icon}
        {label}
      </div>
      <div className={cn('num tabular-nums font-semibold text-[15px] leading-tight', valueClass)}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function BfStep({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-1.5 leading-relaxed">
      <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
