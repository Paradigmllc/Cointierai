// Generate stable keys for each (ja,en) pair, organized by file namespace.
import { readFileSync, writeFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('scripts/i18n-extracted.json', 'utf8'));

function fileNamespace(file) {
  // src/app/[locale]/dashboard/tax/page.tsx → dashTax
  // src/app/[locale]/pclaim/page.tsx → pclaim
  // src/components/coin/AiSummaryCard.tsx → aiSummary
  // src/components/home/HighlightCards.tsx → highlight
  // src/components/wallet/BuilderFeeModal.tsx → builderModal
  // Special: homepage and ido review
  if (file === 'src/app/[locale]/page.tsx') return 'homePage';
  if (file.startsWith('src/app/[locale]/ido/[slug]/reviews/')) return 'idoReview';
  if (file === 'src/app/[locale]/tier/[tier]/page.tsx') return 'tierPage';
  if (file === 'src/app/[locale]/vc/[slug]/page.tsx') return 'vcDetail';
  if (file === 'src/app/[locale]/compare/[pair]/page.tsx') return 'compare';

  const m = file.match(/src\/app\/\[locale\]\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?\/page\.tsx/);
  if (m) {
    const parts = [m[1], m[2], m[3]].filter(Boolean).filter((p) => !p.startsWith('['));
    if (parts.length === 1) return parts[0];
    // dashboard/tax → dashTax / dashboard/wallet → dashWallet
    if (parts[0] === 'dashboard') return 'dash' + cap(parts[1] || 'home');
    if (parts[0] === 'auth') return 'auth' + cap(parts[1] || '');
    if (parts[0] === 'tools') return 'tools' + cap(parts[1] || '');
    return parts.join('');
  }
  const m2 = file.match(/src\/components\/([^/]+)\/([^/]+)\.tsx/);
  if (m2) {
    const [, cat, name] = m2;
    if (cat === 'coin' && name === 'AiSummaryCard') return 'aiSummary';
    if (cat === 'coin' && name === 'AffiliateCTA') return 'affCta';
    if (cat === 'coin' && name === 'PolymarketMarkets') return 'polyMarkets';
    if (cat === 'coin' && name === 'CoinDetailTabs') return 'coinTabs';
    if (cat === 'coin' && name === 'CoinChartSmart') return 'coinChart';
    if (cat === 'coin' && name === 'ProGateBlur') return 'proGate';
    if (cat === 'coin' && name === 'JpExchanges') return 'jpExch';
    if (cat === 'coin') return 'coin' + name.replace(/^TradingView/, 'tv');
    if (cat === 'home' && name === 'HighlightCards') return 'highlight';
    if (cat === 'home' && name === 'MarketFilterTabs') return 'marketTabs';
    if (cat === 'wallet' && name === 'BuilderFeeModal') return 'builderModal';
    if (cat === 'wallet' && name === 'ConnectWalletButton') return 'connectBtn';
    if (cat === 'auth' && name === 'AuthForm') return 'authForm';
    if (cat === 'auth' && name === 'AuthButton') return 'authBtn';
    return cat + cap(name);
  }
  // src/app/api/portfolio/analyze/route.ts
  if (file.includes('/api/')) {
    const seg = file.split('/api/')[1].split('/')[0];
    return 'api' + cap(seg);
  }
  return 'misc';
}

function cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

function slugify(en) {
  // produce a short camelCase key from EN
  let s = en
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join(' ');
  if (!s) s = 'k';
  const parts = s.split(' ');
  return parts[0] + parts.slice(1).map(cap).join('');
}

// Build: for each pair, determine namespace + key
const additions = {}; // ns → { key: { ja, en } }
const manifest = []; // { file, ja, en, ns, key }

const usedPerNs = new Map(); // ns → Set of used keys

for (const item of data) {
  const ns = fileNamespace(item.files[0]);
  if (!usedPerNs.has(ns)) usedPerNs.set(ns, new Map());
  const used = usedPerNs.get(ns);
  let base = slugify(item.en);
  if (base.length > 40) base = base.slice(0, 40);
  let key = base;
  let i = 2;
  while (used.has(key) && used.get(key) !== item.en) {
    key = base + i++;
  }
  used.set(key, item.en);
  if (!additions[ns]) additions[ns] = {};
  additions[ns][key] = { ja: item.ja, en: item.en };
  for (const f of item.files) {
    manifest.push({ file: f, ja: item.ja, en: item.en, ns, key });
  }
}

writeFileSync('scripts/i18n-additions.json', JSON.stringify(additions, null, 2), 'utf8');
writeFileSync('scripts/i18n-manifest.json', JSON.stringify(manifest, null, 2), 'utf8');

const nsCount = Object.entries(additions).map(([ns, kv]) => [ns, Object.keys(kv).length]);
nsCount.sort((a, b) => b[1] - a[1]);
console.log('Namespaces (sorted by key count):');
for (const [ns, n] of nsCount) {
  console.log(`  ${ns.padEnd(20)} ${n}`);
}
console.log(`\nTotal pairs: ${data.length}`);
console.log(`Total namespaces: ${nsCount.length}`);
console.log(`Manifest entries (file × pair): ${manifest.length}`);
