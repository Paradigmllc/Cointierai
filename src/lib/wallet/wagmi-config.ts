/**
 * Wagmi + Viem 設定 — Hyperliquid 対応ウォレット接続
 *
 * Notion L2185-2201: Privy を併用してメール/SNS ログインでも対応 (M3-M4)
 * 現状 M1: MetaMask / Rabby / WalletConnect の標準接続
 */

import { http, createConfig } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { injected, walletConnect, metaMask } from 'wagmi/connectors';

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum],
  connectors: [
    injected({ shimDisconnect: true }),
    metaMask({ dappMetadata: { name: 'Cointier', url: 'https://cointier.ai' } }),
    ...(WC_PROJECT_ID
      ? [
          walletConnect({
            projectId: WC_PROJECT_ID,
            metadata: { name: 'Cointier', description: "Asia's AI Crypto Intelligence", url: 'https://cointier.ai', icons: ['https://cointier.ai/icon.png'] },
          }),
        ]
      : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
