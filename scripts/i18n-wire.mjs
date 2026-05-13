// Wire `tT` to next-intl in each file that uses it.
// Strategy:
//  - Client components (`'use client'`): use `useTranslations()` (no namespace → full root access via dotted keys).
//  - Server components / routes: use `await getTranslations({ locale })`.
//  - Replace existing `const t = (ja: string, en: string) => ...` with appropriate `const tT = ...`.
//  - Add imports if missing.
//
// Also handles section/helper functions that use `tT` but lack a local helper:
//   if a function takes `locale: Locale` (or `locale: string`) prop and uses tT, inject
//   `const tT = await getTranslations({ locale });` at the start of its body, and mark it async.
import { readFileSync, writeFileSync } from 'node:fs';

const files = [
  'src/app/api/portfolio/analyze/route.ts',
  'src/app/[locale]/auth/login/page.tsx',
  'src/app/[locale]/auth/signup/page.tsx',
  'src/app/[locale]/coins/page.tsx',
  'src/app/[locale]/compare/[pair]/page.tsx',
  'src/app/[locale]/dashboard/alerts/page.tsx',
  'src/app/[locale]/dashboard/builder-fee/page.tsx',
  'src/app/[locale]/dashboard/page.tsx',
  'src/app/[locale]/dashboard/portfolio/page.tsx',
  'src/app/[locale]/dashboard/tax/page.tsx',
  'src/app/[locale]/dashboard/wallet/page.tsx',
  'src/app/[locale]/dashboard/watchlist/page.tsx',
  'src/app/[locale]/ido/page.tsx',
  'src/app/[locale]/ido/[slug]/reviews/[user]/page.tsx',
  'src/app/[locale]/page.tsx',
  'src/app/[locale]/pclaim/page.tsx',
  'src/app/[locale]/predictions/page.tsx',
  'src/app/[locale]/vcs/page.tsx',
  'src/components/auth/AuthButton.tsx',
  'src/components/auth/AuthForm.tsx',
  'src/components/coin/AffiliateCTA.tsx',
  'src/components/coin/AiSummaryCard.tsx',
  'src/components/coin/CoinChartSmart.tsx',
  'src/components/coin/CoinDetailTabs.tsx',
  'src/components/coin/PolymarketMarkets.tsx',
  'src/components/coin/TradingViewHeatmap.tsx',
  'src/components/coin/TradingViewMiniChart.tsx',
  'src/components/coin/TradingViewSymbolOverview.tsx',
  'src/components/coin/TradingViewTickerTape.tsx',
  'src/components/home/HighlightCards.tsx',
  'src/components/home/MarketFilterTabs.tsx',
  'src/components/wallet/ConnectWalletButton.tsx',
];

const stats = [];

for (const path of files) {
  let src = readFileSync(path, 'utf8');
  const before = src;
  const isClient = /^['"]use client['"]/m.test(src.slice(0, 200));

  if (isClient) {
    // 1) Add useTranslations import if missing
    if (!/from\s+['"]next-intl['"]/.test(src) || !/\buseTranslations\b/.test(src.match(/import[^;]*next-intl['"]/)?.[0] ?? '')) {
      // If next-intl is already imported, add useTranslations to its import list
      if (/import\s*\{[^}]*\}\s*from\s*['"]next-intl['"]/.test(src)) {
        src = src.replace(/import\s*\{\s*([^}]+)\}\s*from\s*['"]next-intl['"]/, (m, names) => {
          const list = names.split(',').map((s) => s.trim()).filter(Boolean);
          if (!list.includes('useTranslations')) list.push('useTranslations');
          return `import { ${list.join(', ')} } from 'next-intl'`;
        });
      } else {
        // Add fresh import after the first import group
        src = src.replace(/(^(?:import[^;]*;\s*\n)+)/m, (m) => m + `import { useTranslations } from 'next-intl';\n`);
      }
    }
    // 2) Replace local ternary helper with const tT = useTranslations();
    src = src.replace(
      /const\s+t\s*=\s*\(ja\s*:\s*string\s*,\s*en\s*:\s*string\s*\)\s*=>\s*\(?\s*locale\s*===\s*['"]ja['"]\s*\?\s*ja\s*:\s*en\s*\)?\s*;?/g,
      `const tT = useTranslations();`,
    );
  } else {
    // Server
    // 1) Ensure getTranslations is imported from next-intl/server
    if (/import\s*\{[^}]*\}\s*from\s*['"]next-intl\/server['"]/.test(src)) {
      src = src.replace(/import\s*\{\s*([^}]+)\}\s*from\s*['"]next-intl\/server['"]/, (m, names) => {
        const list = names.split(',').map((s) => s.trim()).filter(Boolean);
        if (!list.includes('getTranslations')) list.push('getTranslations');
        return `import { ${list.join(', ')} } from 'next-intl/server'`;
      });
    } else {
      src = src.replace(/(^(?:import[^;]*;\s*\n)+)/m, (m) => m + `import { getTranslations } from 'next-intl/server';\n`);
    }
    // 2) Replace local ternary helper. Server context — declare tT via await getTranslations.
    src = src.replace(
      /const\s+t\s*=\s*\(ja\s*:\s*string\s*,\s*en\s*:\s*string\s*\)\s*=>\s*\(?\s*locale\s*===\s*['"]ja['"]\s*\?\s*ja\s*:\s*en\s*\)?\s*;?/g,
      `const tT = await getTranslations({ locale });`,
    );
  }

  if (src !== before) {
    writeFileSync(path, src, 'utf8');
    stats.push({ path, isClient });
  }
}

stats.sort((a, b) => a.path.localeCompare(b.path));
console.log('Wired files:');
for (const s of stats) console.log(`  ${s.isClient ? 'client' : 'server'}  ${s.path}`);
console.log(`\nTotal: ${stats.length}`);
