// i18n parity audit — compares all locales against ja (canonical).
import { readFileSync } from 'node:fs';

function flatten(obj, prefix = '') {
  const keys = new Set();
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const next = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        for (const x of flatten(v, next)) keys.add(x);
      } else {
        keys.add(next);
      }
    }
  }
  return keys;
}

function get(obj, dotted) {
  return dotted.split('.').reduce((cur, part) => (cur && typeof cur === 'object' ? cur[part] : undefined), obj);
}

const load = (loc) => JSON.parse(readFileSync(`src/messages/${loc}.json`, 'utf8'));

const base = load('ja');
const baseKeys = flatten(base);
console.log(`ja (canonical) total keys: ${baseKeys.size}\n`);

const kanaKanji = /[぀-ゟ゠-ヿ一-鿿㐀-䶿]/;

for (const loc of ['en', 'th', 'vi', 'id', 'zh-TW', 'ko']) {
  const d = load(loc);
  const k = flatten(d);
  const missing = [...baseKeys].filter((x) => !k.has(x)).sort();
  const extra = [...k].filter((x) => !baseKeys.has(x)).sort();
  console.log(`=== ${loc} ===`);
  console.log(`  total: ${k.size}`);
  console.log(`  missing keys: ${missing.length}`);
  for (const m of missing.slice(0, 10)) console.log(`    - ${m}`);
  if (missing.length > 10) console.log(`    ... +${missing.length - 10} more`);
  console.log(`  extra keys: ${extra.length}`);
  for (const e of extra.slice(0, 5)) console.log(`    + ${e}`);

  // For non-CJK locales, untranslated kanji is a clear issue.
  // For zh-TW, kanji is expected (sharing Chinese characters).
  // For ko, hangul/no-kanji is expected.
  const checkJp = loc !== 'zh-TW';
  if (checkJp) {
    const suspect = [];
    for (const key of [...baseKeys].filter((x) => k.has(x))) {
      const v = get(d, key);
      if (typeof v === 'string' && kanaKanji.test(v)) {
        // kana (hiragana/katakana) is always JP-only; bare kanji could be borrowed
        const hasKana = /[぀-ゟ゠-ヿ]/.test(v);
        if (hasKana || loc !== 'ko') suspect.push([key, v]);
      }
    }
    console.log(`  untranslated (JP script in value): ${suspect.length}`);
    for (const [key, v] of suspect.slice(0, 8)) {
      const short = v.length > 60 ? v.slice(0, 60) + '...' : v;
      console.log(`    ! ${key} = ${JSON.stringify(short)}`);
    }
    if (suspect.length > 8) console.log(`    ... +${suspect.length - 8} more`);
  }
  console.log();
}
