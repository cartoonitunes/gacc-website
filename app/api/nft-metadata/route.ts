import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, tokenId } = await request.json();
    if (!contractAddress || tokenId === undefined) {
      return NextResponse.json({ error: 'contractAddress and tokenId are required' }, { status: 400 });
    }

    const apiKey = process.env.OPENSEA_API_KEY;
    const url = `https://api.opensea.io/api/v2/metadata/ethereum/${contractAddress}/${tokenId}`;
    const response = await fetch(url, {
      headers: { accept: '*/*', 'x-api-key': apiKey! },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ contractAddress, tokenId, metadata: null, error: 'NFT metadata not found' });
      }
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const metadata = await response.json();
    return NextResponse.json({ contractAddress, tokenId, metadata });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch NFT metadata', details: (error as Error).message },
      { status: 500 }
    );
  }
}
