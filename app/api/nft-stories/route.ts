import { NextResponse } from 'next/server';
import nftStories from '@/data/nft-stories.json';

const storiesMap = nftStories as Record<string, { tokenId: string }>;

export async function GET() {
  try {
    const storiesArray = Object.values(storiesMap).sort(
      (a, b) => parseInt(a.tokenId) - parseInt(b.tokenId)
    );
    return NextResponse.json({ success: true, stories: storiesArray });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stories', details: (error as Error).message },
      { status: 500 }
    );
  }
}
