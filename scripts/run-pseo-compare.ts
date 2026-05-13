import 'dotenv/config';
import { generateCompareMatrix } from '../src/lib/pseo/compare-generator';

(async () => {
  const topN = Number(process.env.PSEO_TOPN ?? 30);
  console.log(`→ generating compare matrix top ${topN} × top ${topN} × 7 locales`);
  const t0 = Date.now();
  const r = await generateCompareMatrix(topN);
  console.log(`✓ generated=${r.generated} cacheHitRate=${(r.cacheHitRate * 100).toFixed(1)}% errors=${r.errors.length} totalMs=${Date.now() - t0}`);
  if (r.errors.length) console.log('errors[0..5]:', r.errors.slice(0, 5));
})();
