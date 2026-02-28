import { NextRequest, NextResponse } from 'next/server';
import gaccToBayc from '@/data/matches/matches_gacc_to_bayc.json';
import baycToGacc from '@/data/matches/matches_bayc_to_gacc.json';
import maccToMayc from '@/data/matches/matches_macc_to_mayc.json';
import maycToMacc from '@/data/matches/matches_mayc_to_macc.json';

const matchData: Record<string, Record<string, { match_id: string; score: number }>> = {
  'gacc-to-bayc': gaccToBayc as any,
  'bayc-to-gacc': baycToGacc as any,
  'macc-to-mayc': maccToMayc as any,
  'mayc-to-macc': maycToMacc as any,
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ direction: string; id: string }> }) {
  const { direction, id } = await params;
  const data = matchData[direction];
  if (!data) {
    return NextResponse.json({ success: false, error: 'Invalid direction' }, { status: 400 });
  }
  const match = data[id];
  if (!match) {
    return NextResponse.json({ success: false, error: 'No match found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, ...match });
}
