/**
 * GlobalStatsBarServer — layout.tsx で使う server-side fetch + render 版
 *
 * CryptoRank.io の最上部 sticky thin bar を寸分違わず再現:
 *   Currencies XX,XXX · Market Cap $X.XXT (+0.06%) · 24h Spot Volume $XX.XXB · Dominance: BTC 58.44% +0.03% ETH 9.99% -0.29% · ETH Gas 0.11 Gwei
 *
 * - 5min ISR
 * - 失敗時は表示せず gracefully degrade
 * - layout で render するため全 page で表示
 */
import { getMarketGlobal } from '@/lib/db/queries';
import { getEthGasGwei } from '@/lib/api/market-extras';
import { GlobalStatsBar } from './GlobalStatsBar';

export async function GlobalStatsBarServer() {
  const [global, ethGas] = await Promise.all([
    getMarketGlobal().catch(() => null),
    getEthGasGwei().catch(() => null),
  ]);
  return <GlobalStatsBar global={global} ethGasGwei={ethGas} />;
}
