/**
 * Messari profile proxy — team / investors / audits / tagline.
 */
import { NextResponse } from 'next/server';
import { getAssetProfile } from '@/lib/api/messari';

export const revalidate = 86_400;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') ?? '';
  if (!slug) return NextResponse.json({});
  const p = await getAssetProfile(slug);
  if (!p) return NextResponse.json({});
  const overview = p.profile?.general?.overview;
  return NextResponse.json({
    contributors: p.profile?.contributors?.individuals ?? [],
    organizations: p.profile?.contributors?.organizations ?? [],
    investors: p.profile?.investors?.organizations ?? [],
    auditLinks: [],
    tagline: overview?.tagline ?? null,
    category: overview?.category ?? null,
    sector: overview?.sector ?? null,
    governanceDetails: p.profile?.governance?.governance_details ?? null,
  });
}
