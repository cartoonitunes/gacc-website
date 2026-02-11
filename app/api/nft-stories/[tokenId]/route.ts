import { NextRequest, NextResponse } from 'next/server';
import nftStories from '@/data/nft-stories.json';

const storiesMap = nftStories as Record<string, unknown>;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  try {
    const story = storiesMap[tokenId];
    if (!story) {
      return NextResponse.json(
        { success: false, error: 'Story not found for this token ID' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, story });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch story', details: (error as Error).message },
      { status: 500 }
    );
  }
}
