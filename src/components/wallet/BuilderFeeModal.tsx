'use client';

import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import { Sparkles, Shield, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { approveBuilderFee, getBuilderAddress, getMaxFeeRate } from '@/lib/wallet/hyperliquid-builder';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BuilderFeeModalProps {
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
  locale: 'ja' | 'en' | 'th' | 'vi' | 'id' | 'zh-TW' | 'ko';
}

/**
 * goodcryptoX 方式 Builder Fee 承認モーダル (Notion L2125-2161)
 *
 * ウォレット接続直後に表示。EIP-712 署名のみ・ガス代なし。
 * パターン A (完全透明) を採用 — Notion L2165-2171
 */
export function BuilderFeeModal({ open, onClose, onApproved, locale }: BuilderFeeModalProps) {
  const { data: walletClient } = useWalletClient();
  const [approving, setApproving] = useState(false);

  if (!open) return null;

  const t = TRANSLATIONS[locale] ?? TRANSLATIONS.en;

  const handleApprove = async () => {
    if (!walletClient) {
      toast.error('Wallet not connected');
      return;
    }
    setApproving(true);
    try {
      const result = await approveBuilderFee(walletClient);
      if (result.success) {
        // Save to DB
        await fetch('/api/wallet/builder-fee-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: walletClient.account?.address,
            builderAddress: result.builderAddress,
            maxFeeRate: result.maxFeeRate,
            signature: result.signature,
            approvedAt: result.approvedAt,
            protocol: 'hyperliquid',
          }),
        }).catch(() => {});
        toast.success(t.success);
        onApproved();
        onClose();
      } else {
        toast.error(result.error ?? 'Approval failed');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-xl border border-border/60 bg-card p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t.title}</h2>
            <p className="text-xs text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <Feature icon={<Sparkles className="h-4 w-4 text-primary" />} text={t.feature1} />
          <Feature icon={<Sparkles className="h-4 w-4 text-primary" />} text={t.feature2} />
          <Feature icon={<Sparkles className="h-4 w-4 text-primary" />} text={t.feature3} />
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-semibold">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            {t.feeNotice}
          </div>
          <div className="text-muted-foreground space-y-1">
            <div>· {t.feeAmount}: <span className="num font-mono">{getMaxFeeRate()}</span></div>
            <div>· Builder: <span className="num font-mono text-[10px]">{truncate(getBuilderAddress(), 10, 6)}</span></div>
            <div>· {t.gasNote}</div>
            <div>· {t.revokeNote}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={approving}>
            {t.cancel}
          </Button>
          <Button onClick={handleApprove} className="flex-1" disabled={approving || !walletClient}>
            {approving ? t.approving : t.approve}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <span className="text-foreground/90">{text}</span>
    </div>
  );
}

function truncate(s: string, head: number, tail: number) {
  if (s.length <= head + tail) return s;
  return s.slice(0, head) + '…' + s.slice(-tail);
}

type Tx = {
  title: string; subtitle: string;
  feature1: string; feature2: string; feature3: string;
  feeNotice: string; feeAmount: string; gasNote: string; revokeNote: string;
  approve: string; approving: string; cancel: string; success: string;
};

const TRANSLATIONS: Record<string, Tx> = {
  ja: {
    title: 'Hyperliquid 連携を有効化',
    subtitle: 'ウォレットで EIP-712 署名 (ガス代なし)',
    feature1: 'Hyperliquid 取引履歴の自動インポート',
    feature2: '保有銘柄の AI 分析・税務レポート生成',
    feature3: 'アンロックアラートとパーソナライズ',
    feeNotice: 'サービス料について',
    feeAmount: '最大サービス料率',
    gasNote: 'ガス代ゼロ (オフチェーン署名)',
    revokeNote: 'いつでも解除可能',
    approve: '有効化する',
    approving: '署名中…',
    cancel: 'キャンセル',
    success: 'Hyperliquid 連携を有効化しました',
  },
  en: {
    title: 'Enable Hyperliquid Integration',
    subtitle: 'Sign EIP-712 message (no gas)',
    feature1: 'Auto-import Hyperliquid trade history',
    feature2: 'AI portfolio analysis & tax reports',
    feature3: 'Unlock alerts and personalization',
    feeNotice: 'About service fee',
    feeAmount: 'Max service fee rate',
    gasNote: 'Zero gas (off-chain signature)',
    revokeNote: 'Revokable anytime',
    approve: 'Enable',
    approving: 'Signing…',
    cancel: 'Cancel',
    success: 'Hyperliquid integration enabled',
  },
  th: { title: 'เปิดใช้งาน Hyperliquid', subtitle: 'ลง EIP-712 (ไม่มี gas)', feature1: 'นำเข้าประวัติการเทรด', feature2: 'วิเคราะห์ AI พอร์ตและรายงานภาษี', feature3: 'การแจ้งเตือนการปลดล็อก', feeNotice: 'ค่าบริการ', feeAmount: 'อัตราสูงสุด', gasNote: 'ไม่มี gas', revokeNote: 'ยกเลิกได้', approve: 'เปิดใช้งาน', approving: 'กำลังเซ็น…', cancel: 'ยกเลิก', success: 'เปิดใช้งานแล้ว' },
  vi: { title: 'Bật tích hợp Hyperliquid', subtitle: 'Ký EIP-712 (không gas)', feature1: 'Tự động nhập lịch sử giao dịch', feature2: 'Phân tích AI và báo cáo thuế', feature3: 'Cảnh báo mở khóa', feeNotice: 'Về phí dịch vụ', feeAmount: 'Tỷ lệ tối đa', gasNote: 'Không gas', revokeNote: 'Có thể hủy bất cứ lúc nào', approve: 'Bật', approving: 'Đang ký…', cancel: 'Hủy', success: 'Đã bật' },
  id: { title: 'Aktifkan Hyperliquid', subtitle: 'Tandatangani EIP-712 (tanpa gas)', feature1: 'Impor riwayat trading otomatis', feature2: 'Analisis AI dan laporan pajak', feature3: 'Peringatan unlock', feeNotice: 'Tentang biaya layanan', feeAmount: 'Tarif maksimum', gasNote: 'Tanpa gas', revokeNote: 'Bisa dicabut kapan saja', approve: 'Aktifkan', approving: 'Menandatangani…', cancel: 'Batal', success: 'Telah aktif' },
  'zh-TW': { title: '啟用 Hyperliquid 整合', subtitle: '簽署 EIP-712 (無 gas)', feature1: '自動匯入交易記錄', feature2: 'AI 分析與稅務報告', feature3: '解鎖警示', feeNotice: '關於服務費', feeAmount: '最大費率', gasNote: '無 gas 費', revokeNote: '可隨時撤銷', approve: '啟用', approving: '簽署中…', cancel: '取消', success: '已啟用' },
  ko: { title: 'Hyperliquid 연동 활성화', subtitle: 'EIP-712 서명 (가스 없음)', feature1: '거래 내역 자동 가져오기', feature2: 'AI 포트폴리오 분석 및 세무 리포트', feature3: '언락 알림', feeNotice: '서비스 수수료 안내', feeAmount: '최대 수수료율', gasNote: '가스 없음', revokeNote: '언제든 해지 가능', approve: '활성화', approving: '서명 중…', cancel: '취소', success: '활성화되었습니다' },
};
