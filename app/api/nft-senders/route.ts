import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { nfts, countryClubAddress } = await request.json();
    if (!Array.isArray(nfts) || nfts.length === 0) {
      return NextResponse.json({ error: 'nfts array is required' }, { status: 400 });
    }
    if (!countryClubAddress) {
      return NextResponse.json({ error: 'countryClubAddress is required' }, { status: 400 });
    }

    const ccAddress = countryClubAddress.toLowerCase();
    const apiKey = process.env.MORALIS_API_KEY;
    const results: Record<string, unknown> = {};

    for (const nft of nfts) {
      try {
        const collection = nft.collection.toLowerCase();
        const tokenId = nft.tokenId;
        const url = `https://deep-index.moralis.io/api/v2.2/nft/${collection}/${tokenId}/transfers?chain=eth&format=decimal&limit=25&order=DESC`;

        const response = await fetch(url, {
          headers: { Accept: 'application/json', 'X-API-Key': apiKey! },
        });

        if (!response.ok) continue;

        const data = await response.json();
        const transfer = data.result?.find(
          (t: { to_address?: string }) => t.to_address?.toLowerCase() === ccAddress
        );

        if (transfer) {
          results[`${collection}-${tokenId}`] = {
            collection,
            tokenId,
            sender: transfer.from_address,
            senderLabel: transfer.from_address_label,
            senderEntity: transfer.from_address_entity,
            transactionHash: transfer.transaction_hash,
            blockNumber: transfer.block_number,
            blockTimestamp: transfer.block_timestamp,
          };
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch {
        continue;
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch NFT senders', details: (error as Error).message },
      { status: 500 }
    );
  }
}
