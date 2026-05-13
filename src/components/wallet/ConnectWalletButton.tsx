'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { BuilderFeeModal } from '@/components/wallet/BuilderFeeModal';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import type { Locale } from '@/i18n/routing';

interface ConnectWalletButtonProps {
  /** 接続成功後に自動で Builder Fee モーダルを開くか (goodcryptoX 方式) */
  autoOpenBuilderFee?: boolean;
}

/**
 * ウォレット接続 + Builder Fee 承認の一気通貫 UI (goodcryptoX 方式)
 *
 * Notion L2125-2161:
 *   1. ボタンクリック → ウォレット選択 (MetaMask / WalletConnect)
 *   2. 接続成功
 *   3. **即座に BuilderFeeModal を開く** (autoOpenBuilderFee=true の場合)
 *   4. EIP-712 署名 → 完了
 *
 * 既存接続済ユーザーには「接続済み」ドロップダウンを表示。
 */
export function ConnectWalletButton({ autoOpenBuilderFee = true }: ConnectWalletButtonProps) {
  const { address, isConnected, status } = useAccount();
  const { connectors, connect, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [hasJustConnected, setHasJustConnected] = useState(false);
  const locale = useLocale() as Locale;

  // 接続成功直後に自動で Builder Fee モーダルを開く
  useEffect(() => {
    if (isConnected && hasJustConnected && autoOpenBuilderFee) {
      const timer = setTimeout(() => setShowBuilderModal(true), 500);
      setHasJustConnected(false);
      return () => clearTimeout(timer);
    }
  }, [isConnected, hasJustConnected, autoOpenBuilderFee]);

  const handleConnect = (connectorId: string) => {
    const connector = connectors.find((c: { id: string; name: string }) => c.id === connectorId || c.name === connectorId);
    if (!connector) {
      toast.error('Connector not available');
      return;
    }
    connect(
      { connector },
      {
        onSuccess: () => setHasJustConnected(true),
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  if (isConnected && address) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <span className="h-2 w-2 rounded-full bg-gain" />
              <span className="num font-mono text-xs">{truncate(address)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Wallet</DropdownMenuLabel>
            <DropdownMenuItem className="font-mono text-xs">{truncate(address, 10, 8)}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowBuilderModal(true)}>
              <Wallet className="h-4 w-4 mr-2" />
              {locale === 'ja' ? 'Hyperliquid 連携設定' : 'Hyperliquid Settings'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => disconnect()}>
              <LogOut className="h-4 w-4 mr-2" />
              {locale === 'ja' ? '切断' : 'Disconnect'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <BuilderFeeModal open={showBuilderModal} onClose={() => setShowBuilderModal(false)} onApproved={() => {}} locale={locale} />
      </>
    );
  }

  if (status === 'reconnecting' || connecting) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        {locale === 'ja' ? '接続中…' : 'Connecting…'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          {locale === 'ja' ? 'ウォレット接続' : 'Connect'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Select wallet</DropdownMenuLabel>
        {connectors.map((c: { uid: string; id: string; name: string }) => (
          <DropdownMenuItem key={c.uid} onClick={() => handleConnect(c.id)} className="cursor-pointer">
            <Wallet className="h-4 w-4 mr-2" />
            {c.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function truncate(addr: string, head = 6, tail = 4) {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
