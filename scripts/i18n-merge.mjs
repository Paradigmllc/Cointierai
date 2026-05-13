// Merge new additions into all 7 locale messages files.
// For locales without translations yet, use EN as fallback (sane until translations land).
// Translations dictionary is supplied via scripts/i18n-translations.json (optional).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const additions = JSON.parse(readFileSync('scripts/i18n-additions.json', 'utf8'));
const transFile = 'scripts/i18n-translations.json';
const translations = existsSync(transFile) ? JSON.parse(readFileSync(transFile, 'utf8')) : {};
// translations: { ns: { key: { th, vi, id, "zh-TW", ko } } }

const LOCALES = ['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'];

for (const loc of LOCALES) {
  const path = `src/messages/${loc}.json`;
  const cur = JSON.parse(readFileSync(path, 'utf8'));
  for (const [ns, pairs] of Object.entries(additions)) {
    if (!cur[ns]) cur[ns] = {};
    for (const [key, { ja, en }] of Object.entries(pairs)) {
      let value;
      if (loc === 'ja') value = ja;
      else if (loc === 'en') value = en;
      else {
        const t = translations[ns]?.[key]?.[loc];
        value = t ?? en; // fallback to en if no translation
      }
      cur[ns][key] = value;
    }
  }
  writeFileSync(path, JSON.stringify(cur, null, 2) + '\n', 'utf8');
  console.log(`Updated ${path}`);
}

// Summary
const tCount = Object.entries(additions).reduce((n, [, kv]) => n + Object.keys(kv).length, 0);
const haveTrans = (loc) =>
  Object.entries(translations).reduce(
    (n, [, kv]) =>
      n + Object.values(kv).filter((v) => v && typeof v[loc] === 'string' && v[loc].length > 0).length,
    0,
  );
console.log(`\nNew keys per locale: ${tCount}`);
for (const loc of ['th', 'vi', 'id', 'zh-TW', 'ko']) {
  console.log(`  ${loc}: ${haveTrans(loc)} / ${tCount} translated (rest = EN fallback)`);
}
