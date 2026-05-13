/**
 * scripts/ingest-all.ts
 *
 * 全 free API データ取得 orchestrator
 *
 * 実行順 (依存関係順):
 *   1. CoinGecko markets    (coins master)
 *   2. CoinGecko details    (description, links, categories)
 *   3. DeFiLlama raises/hacks (funding_rounds, hacks)
 *   4. CryptoRank           (cryptorank_id 紐付け + 詳細 funding)
 *   5. RootData             (アジア VC fund)
 *   6. Tokenomist + Llama   (token_unlocks)
 *   7. DEXScreener          (coin_exchanges 補完)
 *   8. Token Terminal       (P/E, P/S)
 *   9. LunarCRUSH           (social signals)
 *  10. compute-tiers        (6 軸スコア算出)
 *  11. generate-summaries   (7 言語 LLM サマリー)
 *
 * 実行: pnpm ingest:all
 */

import 'dotenv/config';
import { spawn } from 'node:child_process';

const steps: Array<{ name: string; script: string; required: boolean }> = [
  // Phase 1: 基盤 coins テーブル投入
  { name: 'CoinGecko markets',       script: 'scripts/ingest-coingecko.ts',         required: true },
  { name: 'CoinGecko details',       script: 'scripts/ingest-coingecko-details.ts', required: false },
  // Phase 2: 各ソースから signals を coins に集約 materialize
  { name: 'DeFiLlama (TVL/raises/hacks)', script: 'scripts/ingest-defillama.ts',    required: true },
  { name: 'CryptoRank',              script: 'scripts/ingest-cryptorank.ts',        required: false },
  { name: 'RootData (Asia VCs)',     script: 'scripts/ingest-rootdata.ts',          required: false },
  { name: 'Tokenomist + Llama Unlocks', script: 'scripts/ingest-tokenomist.ts',     required: false },
  { name: 'DEXScreener (DEX liquidity)', script: 'scripts/ingest-dexscreener.ts',   required: false },
  { name: 'Token Terminal (P/E)',    script: 'scripts/ingest-tokenterminal.ts',     required: false },
  { name: 'LunarCRUSH (Social)',     script: 'scripts/ingest-lunarcrush.ts',        required: false },
  { name: 'Hyperliquid (Perps)',     script: 'scripts/ingest-hyperliquid.ts',       required: false },
  // Phase 3: 集約済 signals を使って Tier 算出
  { name: 'Compute Tiers (Pattern B)', script: 'scripts/compute-tiers.ts',           required: true },
  // Phase 4: LLM 7 言語サマリー
  { name: 'Generate Summaries (7 lang)', script: 'scripts/generate-summaries.ts',   required: false },
];

function run(script: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['tsx', script], { stdio: 'inherit', shell: true });
    proc.on('exit', (code) => resolve(code ?? 0));
  });
}

async function main() {
  const overallStart = Date.now();
  const results: Array<{ name: string; status: 'ok' | 'skip' | 'fail'; durSec: number }> = [];

  for (const step of steps) {
    console.log(`\n========== ${step.name} ==========`);
    const t0 = Date.now();
    const code = await run(step.script);
    const durSec = Math.round((Date.now() - t0) / 1000);

    if (code === 0) {
      results.push({ name: step.name, status: 'ok', durSec });
    } else if (!step.required) {
      console.warn(`[ingest:all] ${step.name} failed (code ${code}) — skipping (optional)`);
      results.push({ name: step.name, status: 'skip', durSec });
    } else {
      console.error(`[ingest:all] ${step.name} failed (code ${code}) — REQUIRED, aborting`);
      results.push({ name: step.name, status: 'fail', durSec });
      break;
    }
  }

  const totalSec = Math.round((Date.now() - overallStart) / 1000);
  console.log('\n========== SUMMARY ==========');
  for (const r of results) {
    const icon = r.status === 'ok' ? '✅' : r.status === 'skip' ? '⏭️' : '❌';
    console.log(`${icon} ${r.name.padEnd(40)} ${r.durSec}s`);
  }
  console.log(`\nTotal: ${totalSec}s`);
}

main().catch((err) => {
  console.error('[ingest:all] fatal', err);
  process.exit(1);
});
