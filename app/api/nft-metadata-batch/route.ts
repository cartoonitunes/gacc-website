import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { nfts } = await request.json();
    if (!Array.isArray(nfts) || nfts.length === 0) {
      return NextResponse.json({ error: 'nfts array is required' }, { status: 400 });
    }

    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json({ error: 'RPC_URL not configured' }, { status: 500 });
    }
    const key = rpcUrl.split('/').pop();

    const maxBatchSize = 100;
    const nftsToFetch = nfts.slice(0, maxBatchSize);

    const upstream = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/${key}/getNFTMetadataBatch`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          tokens: nftsToFetch.map((n: { contractAddress: string; tokenId: string }) => ({
            contractAddress: n.contractAddress,
            tokenId: String(n.tokenId),
          })),
        }),
      }
    );

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'Alchemy request failed', status: upstream.status },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    const results = (data.nfts || []).map((nft: any) => ({
      contractAddress: nft.contract?.address,
      tokenId: nft.tokenId,
      metadata: {
        name: nft.name || null,
        image:
          nft.image?.cachedUrl ||
          nft.image?.pngUrl ||
          nft.image?.originalUrl ||
          nft.raw?.metadata?.image ||
          null,
      },
    }));

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch NFT metadata', details: (error as Error).message },
      { status: 500 }
    );
  }
}
