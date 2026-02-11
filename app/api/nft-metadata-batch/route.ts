import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { nfts } = await request.json();
    if (!Array.isArray(nfts) || nfts.length === 0) {
      return NextResponse.json({ error: 'nfts array is required' }, { status: 400 });
    }

    const maxBatchSize = 20;
    const nftsToFetch = nfts.slice(0, maxBatchSize);
    const apiKey = process.env.OPENSEA_API_KEY;
    const results = [];

    for (const nft of nftsToFetch) {
      try {
        const url = `https://api.opensea.io/api/v2/metadata/ethereum/${nft.contractAddress}/${nft.tokenId}`;
        const response = await fetch(url, {
          headers: { accept: '*/*', 'x-api-key': apiKey! },
        });

        if (response.ok) {
          const metadata = await response.json();
          results.push({
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            metadata: { image: metadata.image || null, name: metadata.name || null },
          });
        } else {
          results.push({
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            metadata: null,
            error: `HTTP ${response.status}`,
          });
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          metadata: null,
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch NFT metadata', details: (error as Error).message },
      { status: 500 }
    );
  }
}
