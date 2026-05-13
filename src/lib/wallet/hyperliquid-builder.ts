/**
 * Hyperliquid Builder Fee 承認ロジック (goodcryptoX 方式)
 *
 * Notion L2125-2161 設計実装:
 *   - ウォレット接続 と Builder Fee 承認を **1 フロー内の連続署名** にする
 *   - EIP-712 メッセージ署名のみ・ガス代なし・即時有効
 *   - 一度承認したら永続 (ユーザーが解除しない限り)
 *
 * 承認率: 別フロー 30-40% → goodcryptoX 方式 70-85%
 */

import type { WalletClient } from 'viem';

const BUILDER_ADDRESS = process.env.NEXT_PUBLIC_HYPERLIQUID_BUILDER_ADDRESS ?? '';
const MAX_FEE_RATE = '0.05%';

export interface BuilderFeeApprovalResult {
  success: boolean;
  signature?: string;
  builderAddress: string;
  maxFeeRate: string;
  approvedAt: string;
  error?: string;
}

function buildApprovalMessage(builderAddress: string, maxFeeRate: string) {
  return {
    domain: {
      name: 'Exchange',
      version: '1',
      chainId: 1337,
      verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    },
    types: {
      ApproveBuilderFee: [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'maxFeeRate', type: 'string' },
        { name: 'builder', type: 'address' },
        { name: 'nonce', type: 'uint64' },
      ],
    },
    primaryType: 'ApproveBuilderFee' as const,
    message: {
      hyperliquidChain: 'Mainnet',
      maxFeeRate,
      builder: builderAddress as `0x${string}`,
      nonce: BigInt(Date.now()),
    },
  };
}

export async function approveBuilderFee(walletClient: WalletClient): Promise<BuilderFeeApprovalResult> {
  if (!BUILDER_ADDRESS) {
    return { success: false, builderAddress: '', maxFeeRate: MAX_FEE_RATE, approvedAt: new Date().toISOString(), error: 'BUILDER_ADDRESS not configured' };
  }
  if (!walletClient.account) {
    return { success: false, builderAddress: BUILDER_ADDRESS, maxFeeRate: MAX_FEE_RATE, approvedAt: new Date().toISOString(), error: 'Wallet not connected' };
  }
  try {
    const msg = buildApprovalMessage(BUILDER_ADDRESS, MAX_FEE_RATE);
    const signature = await walletClient.signTypedData({
      account: walletClient.account,
      domain: msg.domain,
      types: msg.types,
      primaryType: msg.primaryType,
      message: msg.message,
    });
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: { type: 'approveBuilderFee', hyperliquidChain: 'Mainnet', maxFeeRate: MAX_FEE_RATE, builder: BUILDER_ADDRESS, nonce: Date.now() },
        nonce: Date.now(),
        signature: parseSignature(signature),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Hyperliquid ${response.status}: ${await response.text()}`);
    const result = (await response.json()) as { status: string };
    return { success: result.status === 'ok', signature, builderAddress: BUILDER_ADDRESS, maxFeeRate: MAX_FEE_RATE, approvedAt: new Date().toISOString() };
  } catch (e) {
    console.error('[hyperliquid-builder] approval failed:', e);
    return { success: false, builderAddress: BUILDER_ADDRESS, maxFeeRate: MAX_FEE_RATE, approvedAt: new Date().toISOString(), error: e instanceof Error ? e.message : 'Unknown' };
  }
}

function parseSignature(sig: string): { r: string; s: string; v: number } {
  const cleaned = sig.replace(/^0x/, '');
  return { r: '0x' + cleaned.slice(0, 64), s: '0x' + cleaned.slice(64, 128), v: parseInt(cleaned.slice(128, 130), 16) };
}

export function getBuilderAddress(): string { return BUILDER_ADDRESS; }
export function getMaxFeeRate(): string { return MAX_FEE_RATE; }
