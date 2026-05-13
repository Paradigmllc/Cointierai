'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

/**
 * Tracking beacon — 全ページに自動挿入 (Layout レベル)
 *
 * - 1x1 img + JS post の二段で確実に session cookie を発行
 * - Cookie 無効ブラウザでも server side session が DB に作られる
 * - S2S トリニティの「セッション永続化 100%」レイヤー
 */
export function TrackingBeacon() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    // JS が動く環境では fetch で軽量 ping
    const params = new URLSearchParams({ page: pathname, locale });
    const url = `/api/attribution/beacon?${params}`;
    // Use sendBeacon if available (page unload でも飛ぶ)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { credentials: 'include', mode: 'no-cors' }).catch(() => {});
    }
  }, [pathname, locale]);

  // 同時に img beacon も挿入 (JS 無効環境向け)
  return (
    <img
      src={`/api/attribution/beacon?page=${encodeURIComponent(pathname)}&locale=${locale}`}
      width={1}
      height={1}
      alt=""
      aria-hidden="true"
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
    />
  );
}
