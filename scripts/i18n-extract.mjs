// Extract all `locale === 'ja' ? 'X' : 'Y'` and `t('X', 'Y')` pairs into a manifest.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'src';
const results = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      walk(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      scan(p);
    }
  }
}

// Match patterns:
//   locale === 'ja' ? '...' : '...'    or with double quotes
//   t('...', '...')                    (inline helper)
//   t(`...`, `...`)                    (template literal)
const patterns = [
  // ternary single-quoted
  /locale\s*===\s*['"]ja['"]\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g,
  // ternary double-quoted
  /locale\s*===\s*['"]ja['"]\s*\?\s*"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
  // ternary backtick (template literal, no ${})
  /locale\s*===\s*['"]ja['"]\s*\?\s*`([^`$]*)`\s*:\s*`([^`$]*)`/g,
  // t('ja', 'en') helper — single quoted
  /\bt\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g,
  // t("ja", "en")
  /\bt\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g,
];

function scan(path) {
  const src = readFileSync(path, 'utf8');
  for (const re of patterns) {
    let m;
    while ((m = re.exec(src)) !== null) {
      results.push({
        file: relative('.', path).replace(/\\/g, '/'),
        ja: m[1],
        en: m[2],
      });
    }
  }
}

walk(ROOT);

// Deduplicate (same ja+en pair, keep file list)
const map = new Map();
for (const r of results) {
  const key = `${r.ja}|||${r.en}`;
  if (!map.has(key)) map.set(key, { ja: r.ja, en: r.en, files: new Set() });
  map.get(key).files.add(r.file);
}

const unique = [...map.values()].map((x) => ({ ja: x.ja, en: x.en, files: [...x.files].sort() }));
unique.sort((a, b) => a.ja.localeCompare(b.ja, 'ja'));

writeFileSync('scripts/i18n-extracted.json', JSON.stringify(unique, null, 2), 'utf8');
console.log(`Total occurrences: ${results.length}`);
console.log(`Unique (ja,en) pairs: ${unique.length}`);
console.log(`Files touched: ${new Set(results.map((r) => r.file)).size}`);
console.log(`\nWritten: scripts/i18n-extracted.json`);
