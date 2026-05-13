'use client';

import { useAccount } from 'wagmi';
import { useLocale, useTranslations } from 'next-intl';
import { Wallet, Zap, Shield, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';

export default function WalletPage() {
  const tT = useTranslations();
  const { address, isConnected, chain } = useAccount();
  const locale = useLocale();

  return (
    <div className="container py-4 max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-tier-d/10">
          <Wallet className="h-6 w-6 text-tier-d" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{tT('dashboard.walletIntegration')}</h1>
          <p className="text-xs text-muted-foreground">
            {tT('dashWallet.hyperliquidHistoryBuilderFeeP')}
          </p>
        </div>
      </header>

      {!isConnected ? (
        <div className="rounded-lg border border-border/60 bg-card/30 p-8 text-center space-y-4">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {tT('dashWallet.connectAWalletToEnable')}
          </p>
          <div className="flex justify-center">
            <ConnectWalletButton autoOpenBuilderFee={true} />
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gain/30 bg-gain/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gain" />
              <span className="font-semibold text-sm">{tT('dashWallet.connected')}</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Address: <span className="num font-mono text-foreground">{address}</span></div>
              <div>Chain: <span className="font-medium text-foreground">{chain?.name ?? 'Unknown'}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FeatureCard
              icon={<Zap className="h-4 w-4 text-primary" />}
              title={tT('dashWallet.builderFee')}
              desc={tT('dashWallet.005MaxOnHyperliquid')}
              badge="EIP-712"
            />
            <FeatureCard
              icon={<Activity className="h-4 w-4 text-gain" />}
              title={tT('dashWallet.tradeHistoryImport')}
              desc={tT('dashWallet.autoImportFromHyperliquid')}
              badge="Auto"
            />
            <FeatureCard
              icon={<Shield className="h-4 w-4 text-tier-d" />}
              title={tT('dashWallet.nonCustodial')}
              desc={tT('dashWallet.assetsStayInYourWallet')}
              badge="Secure"
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
            <h2 className="font-semibold text-sm">{tT('dashWallet.nextSteps')}</h2>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>{tT('dashWallet.signEip712InBuilder')}</li>
              <li>{tT('dashWallet.hyperliquidTradesSyncAutomatically')}</li>
              <li>{tT('dashWallet.taxReportPortfolioAnalysisBecome')}</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, desc, badge }: { icon: React.ReactNode; title: string; desc: string; badge: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="p-1.5 rounded bg-muted/30">{icon}</div>
        <Badge variant="secondary" className="text-[10px]">{badge}</Badge>
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
