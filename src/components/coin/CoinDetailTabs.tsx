'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export type CoinTab = 'overview' | 'markets' | 'analytics' | 'historical' | 'news' | 'signals';

interface CoinDetailTabsProps {
  active?: CoinTab;
  onChange?: (k: CoinTab) => void;
  locale?: string;
}

/**
 * CoinDetailTabs — CryptoRank /price/{coin} 上部の Overview / Markets / Analytics tabs
 *
 * Cointier 拡張: + Signals タブ (全データソース統合シグナル表示)
 */
export function CoinDetailTabs({ active, onChange, locale = 'ja' }: CoinDetailTabsProps) {
  const [internal, setInternal] = useState<CoinTab>(active ?? 'overview');
  const current = active ?? internal;
  const setTab = (k: CoinTab) => {
    setInternal(k);
    onChange?.(k);
  };
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  const tabs: { key: CoinTab; label: string }[] = [
    { key: 'overview',   label: t('概要', 'Overview') },
    { key: 'signals',    label: t('統合シグナル', 'Signals') },
    { key: 'markets',    label: t('取引所', 'Markets') },
    { key: 'analytics',  label: t('分析', 'Analytics') },
    { key: 'historical', label: t('履歴データ', 'Historical') },
    { key: 'news',       label: t('ニュース', 'News') },
  ];
  return (
    <div className="border-b border-border/60 overflow-x-auto thin-scrollbar -mx-2 px-2">
      <div className="flex items-center gap-1 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={cn(
              'relative px-3 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap',
              current === tab.key
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {current === tab.key && <span className="absolute -bottom-px left-2 right-2 h-[2px] bg-primary rounded-t" />}
          </button>
        ))}
      </div>
    </div>
  );
}
