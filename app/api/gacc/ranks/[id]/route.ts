import { NextRequest, NextResponse } from 'next/server';
import ranks from '@/data/ranks/gacc.json';

const ranksMap = ranks as Record<string, string>;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json({ success: true, rank: ranksMap[id] });
  } catch {
    return NextResponse.json({ success: false, rank: null }, { status: 422 });
  }
}
