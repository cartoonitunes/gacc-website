import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import revealedMetadata from '@/data/metadata/revealed-macc.json';
import hiddenMetadata from '@/data/metadata/hidden-macc.json';

const revealed = revealedMetadata as Record<string, unknown>;
const hidden = hiddenMetadata as Record<string, unknown>;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const hiddenMd = hidden[id];
    if (!hiddenMd) {
      return new NextResponse('The token does not exist', { status: 404 });
    }
    const claimed = await kv.get<boolean>(`tokens:${id}`);
    if (claimed) {
      return NextResponse.json(revealed[id]);
    }
    return NextResponse.json(hiddenMd);
  } catch {
    return new NextResponse('The token does not exist', { status: 404 });
  }
}
