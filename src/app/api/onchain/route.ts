/**
 * On-chain metrics proxy (Messari).
 */
import { NextResponse } from 'next/server';
import { getAssetMetrics } from '@/lib/api/messari';

export const revalidate = 3600;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') ?? '';
  if (!slug) return NextResponse.json({});
  const m = await getAssetMetrics(slug);
  if (!m) return NextResponse.json({});
  return NextResponse.json({
    activeAddresses24h: m.blockchain_stats_24_hours?.count_of_active_addresses ?? null,
    txCount24h: null,
    txVolumeUsd24h: m.blockchain_stats_24_hours?.adjusted_transaction_volume ?? null,
    nvtRatio: m.blockchain_stats_24_hours?.adjusted_nvt ?? null,
    vladimirClubCost: m.misc_data?.vladimir_club_cost ?? null,
    athPercentDown: m.all_time_high?.percent_down ?? null,
    cycleLowPercentUp: m.cycle_low?.percent_up ?? null,
  });
}
