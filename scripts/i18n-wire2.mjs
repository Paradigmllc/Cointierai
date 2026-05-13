// Second pass: inject `tT` wiring into files that use tT but don't have it wired.
// Also ensures imports.
//
// Heuristics:
//  - For server components: insert `const tT = await getTranslations({ locale });`
//    immediately after `setRequestLocale(locale);` (or any line containing setRequestLocale).
//  - For client components: insert `const tT = useTranslations();`
//    after the first variable destructuring of `useState`/`useEffect`/`useTranslations`,
//    or just after the opening line of the component (best-effort).
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Find files that have tT() but no wire
const list = execSync('grep -lr "tT(" src --include=*.tsx --include=*.ts', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const stats = [];
for (const path of list) {
  let src = readFileSync(path, 'utf8');
  const before = src;
  const hasWire = /const\s+tT\s*=\s*(useTranslations|await\s+getTranslations)/.test(src);
  if (hasWire) continue;
  const isClient = /^['"]use client['"]/m.test(src.slice(0, 200));

  if (isClient) {
    // Ensure useTranslations imported
    if (/import\s*\{[^}]*\}\s*from\s*['"]next-intl['"]/.test(src)) {
      src = src.replace(/import\s*\{\s*([^}]+)\}\s*from\s*['"]next-intl['"]/, (m, names) => {
        const list = names.split(',').map((s) => s.trim()).filter(Boolean);
        if (!list.includes('useTranslations')) list.push('useTranslations');
        return `import { ${list.join(', ')} } from 'next-intl'`;
      });
    } else {
      src = src.replace(/(^(?:import[^;]*;\s*\n)+)/m, (m) => m + `import { useTranslations } from 'next-intl';\n`);
    }
    // Inject inside the FIRST component function. Look for `export default function` or `export function`
    // then the first opening brace and the next line; or `function Xxx(...) {`. Inject after the brace.
    const injected = src.replace(
      /(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*[:{][^{]*\{)/,
      (m) => m + `\n  const tT = useTranslations();`,
    );
    if (injected !== src) src = injected;
  } else {
    // Server
    if (/import\s*\{[^}]*\}\s*from\s*['"]next-intl\/server['"]/.test(src)) {
      src = src.replace(/import\s*\{\s*([^}]+)\}\s*from\s*['"]next-intl\/server['"]/, (m, names) => {
        const list = names.split(',').map((s) => s.trim()).filter(Boolean);
        if (!list.includes('getTranslations')) list.push('getTranslations');
        return `import { ${list.join(', ')} } from 'next-intl/server'`;
      });
    } else {
      src = src.replace(/(^(?:import[^;]*;\s*\n)+)/m, (m) => m + `import { getTranslations } from 'next-intl/server';\n`);
    }
    // Inject AFTER setRequestLocale(locale); if present
    if (/setRequestLocale\(locale\);/.test(src)) {
      src = src.replace(/(setRequestLocale\(locale\);\s*\n)/, `$1  const tT = await getTranslations({ locale });\n`);
    } else {
      // No setRequestLocale → just inject after `const locale = localeStr as Locale;` or after destructuring `const { locale ... }`
      if (/const\s+locale\s*=\s*localeStr\s+as\s+Locale\s*;/.test(src)) {
        src = src.replace(
          /(const\s+locale\s*=\s*localeStr\s+as\s+Locale\s*;\s*\n)/,
          `$1  const tT = await getTranslations({ locale });\n`,
        );
      } else if (/const\s*\{\s*locale[^}]*\}\s*=\s*await\s+params\s*;/.test(src)) {
        src = src.replace(
          /(const\s*\{\s*locale[^}]*\}\s*=\s*await\s+params\s*;\s*\n)/,
          `$1  const tT = await getTranslations({ locale });\n`,
        );
      }
    }
  }

  if (src !== before) {
    writeFileSync(path, src, 'utf8');
    stats.push({ path, isClient });
  }
}

stats.sort((a, b) => a.path.localeCompare(b.path));
console.log('Wired (pass 2):');
for (const s of stats) console.log(`  ${s.isClient ? 'client' : 'server'}  ${s.path}`);
console.log(`\nTotal: ${stats.length}`);
