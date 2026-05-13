import 'dotenv/config';
import { generateVerdictsBatch } from '../src/lib/pseo/verdict-generator';

(async () => {
  const topN = Number(process.env.PSEO_TOPN ?? 50);
  console.log(`→ generating verdicts for top ${topN} coins × 7 locales`);
  const t0 = Date.now();
  const r = await generateVerdictsBatch({ topN });
  console.log(`✓ generated=${r.generated} skipped=${r.skipped} errors=${r.errors.length} totalMs=${Date.now() - t0}`);
  if (r.errors.length) console.log('errors[0..5]:', r.errors.slice(0, 5));
})();
