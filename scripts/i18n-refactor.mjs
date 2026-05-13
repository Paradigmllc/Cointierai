// Refactor source files: replace `locale === 'ja' ? X : Y` and `t('X','Y')` with `t('key')`.
// Maps via scripts/i18n-manifest.json. Idempotent — runs cleanly on already-refactored files.
import { readFileSync, writeFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('scripts/i18n-manifest.json', 'utf8'));

// Index by file
const byFile = new Map();
for (const m of manifest) {
  if (!byFile.has(m.file)) byFile.set(m.file, []);
  byFile.get(m.file).push(m);
}

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeForQuoted(s, quoteChar) {
  // Convert string for embedding in original JS string literal of given quote type.
  // For matching purposes, we need the LITERAL form as it appears in source.
  // The extractor handled \\. escape; we need to reverse-escape ja/en for matching.
  // Simpler: build patterns for each quote type variant.
  if (quoteChar === "'") return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  if (quoteChar === '"') return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  if (quoteChar === '`') return s; // backtick — no $/backtick handling needed for simple cases
  return s;
}

let totalReplacements = 0;
const fileStats = [];

for (const [file, items] of byFile) {
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  let replaced = 0;

  for (const { ja, en, ns, key } of items) {
    // Try each combination of quote styles for ternary and t() helper
    for (const q of ["'", '"', '`']) {
      const jaEsc = escapeForQuoted(ja, q);
      const enEsc = escapeForQuoted(en, q);

      // ternary: locale === 'ja' ? Q ja Q : Q en Q
      const ternRe = new RegExp(
        `locale\\s*===\\s*['"]ja['"]\\s*\\?\\s*${q}${escRe(jaEsc)}${q}\\s*:\\s*${q}${escRe(enEsc)}${q}`,
        'g',
      );
      src = src.replace(ternRe, () => {
        replaced++;
        return `tT('${ns}.${key}')`;
      });

      // t('ja', 'en') helper-call form
      const helperRe = new RegExp(
        `\\bt\\(\\s*${q}${escRe(jaEsc)}${q}\\s*,\\s*${q}${escRe(enEsc)}${q}\\s*\\)`,
        'g',
      );
      src = src.replace(helperRe, () => {
        replaced++;
        return `tT('${ns}.${key}')`;
      });
    }
  }

  if (replaced > 0) {
    writeFileSync(file, src, 'utf8');
    totalReplacements += replaced;
    fileStats.push({ file, replaced });
  }
}

fileStats.sort((a, b) => b.replaced - a.replaced);
console.log('File refactor summary:');
for (const { file, replaced } of fileStats) {
  console.log(`  ${file.padEnd(60)} ${replaced}`);
}
console.log(`\nTotal replacements: ${totalReplacements}`);
console.log(`\nNote: placeholder \`tT('ns.key')\` is used; a second pass wires useTranslations()/getTranslations() and removes legacy helpers.`);
