'use client';

import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

interface ProGateBlurProps {
  totalCount: number;
  visibleCount: number;
  feature: 'vc-investors' | 'unlocks' | 'historical-impact' | 'ai-summary';
  locale: 'ja' | 'en' | 'th' | 'vi' | 'id' | 'zh-TW' | 'ko';
}

const FEATURE_LABELS: Record<ProGateBlurProps['feature'], Record<string, string>> = {
  'vc-investors': {
    ja: 'VC 投資家',
    en: 'VC investors',
    th: 'นักลงทุน VC',
    vi: 'Nhà đầu tư VC',
    id: 'Investor VC',
    'zh-TW': 'VC 投資者',
    ko: 'VC 투자자',
  },
  unlocks: {
    ja: '今後のアンロック',
    en: 'upcoming unlocks',
    th: 'การปลดล็อกที่จะมาถึง',
    vi: 'mở khóa sắp tới',
    id: 'unlock mendatang',
    'zh-TW': '即將解鎖',
    ko: '예정된 언락',
  },
  'historical-impact': {
    ja: '過去のアンロック影響履歴',
    en: 'historical unlock impact',
    th: 'ผลกระทบในอดีต',
    vi: 'tác động lịch sử',
    id: 'dampak historis',
    'zh-TW': '過往解鎖影響',
    ko: '과거 언락 영향',
  },
  'ai-summary': {
    ja: 'AI 詳細レポート',
    en: 'AI deep dive report',
    th: 'รายงาน AI ลึก',
    vi: 'báo cáo AI chi tiết',
    id: 'laporan AI mendalam',
    'zh-TW': 'AI 深度報告',
    ko: 'AI 심층 보고서',
  },
};

const MESSAGES: Record<string, { title: (count: number, label: string) => string; cta: string; reason: string }> = {
  ja: {
    title: (n, label) => `さらに ${n} 件の${label}があります`,
    cta: 'Pro を見る',
    reason: 'Pro でロックを解除すると全件閲覧 + アラート受信が可能になります',
  },
  en: {
    title: (n, label) => `${n} more ${label} hidden`,
    cta: 'See Pro',
    reason: 'Unlock with Pro to see all entries + receive alerts',
  },
  th: { title: (n, label) => `อีก ${n} รายการ ${label}`, cta: 'ดู Pro', reason: 'อัปเกรดเพื่อปลดล็อกทั้งหมด' },
  vi: { title: (n, label) => `Còn ${n} ${label}`, cta: 'Xem Pro', reason: 'Nâng cấp Pro để xem tất cả' },
  id: { title: (n, label) => `${n} lagi ${label}`, cta: 'Lihat Pro', reason: 'Upgrade Pro untuk semua entri' },
  'zh-TW': { title: (n, label) => `還有 ${n} 個${label}`, cta: '查看 Pro', reason: '升級 Pro 解鎖全部' },
  ko: { title: (n, label) => `${n}개 더 있는 ${label}`, cta: 'Pro 보기', reason: 'Pro 업그레이드로 전체 보기' },
};

/**
 * Free→Pro 転換の壁 — Notion L1955-1973 反映
 *
 * 「残り N 件」を具体的件数で見せて Pro 登録を促す。
 * 壁の手前で Value を感じている + 壁の向こうが具体的に見える設計。
 */
export function ProGateBlur({ totalCount, visibleCount, feature, locale }: ProGateBlurProps) {
  const hiddenCount = Math.max(0, totalCount - visibleCount);
  if (hiddenCount === 0) return null;

  const msg = MESSAGES[locale] ?? MESSAGES.en;
  const label = FEATURE_LABELS[feature][locale] ?? FEATURE_LABELS[feature].en;

  return (
    <div className="relative mt-3 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5 space-y-3">
      {/* 視覚的「ぼかし」効果 */}
      <div className="absolute inset-0 backdrop-blur-[1px] rounded-lg pointer-events-none opacity-30" />

      <div className="relative space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-primary" />
          <span className="font-semibold">{msg.title(hiddenCount, label)}</span>
        </div>

        <p className="text-xs text-muted-foreground">{msg.reason}</p>

        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/pricing">
            <Sparkles className="h-3.5 w-3.5" />
            {msg.cta}
          </Link>
        </Button>
      </div>
    </div>
  );
}
