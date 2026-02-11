import { NextResponse } from 'next/server';

const GACC_COLLECTION_ADDRESS = '0x4B103d07C18798365946E76845EDC6b565779402';

export async function GET() {
  const apiKey = process.env.OPENSEA_API_KEY;

  try {
    const statsUrl = `https://api.opensea.io/api/v2/collections/grandpaapecountryclub/stats`;
    const statsResponse = await fetch(statsUrl, {
      headers: { Accept: 'application/json', 'x-api-key': apiKey! },
    });

    if (statsResponse.ok) {
      const data = await statsResponse.json();
      if (data.total?.floor_price != null) {
        return NextResponse.json(
          { floorPrice: parseFloat(data.total.floor_price), source: 'opensea_stats' },
          { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
        );
      }
    }

    const listingsUrl = `https://api.opensea.io/api/v2/orders/ethereum/seaport/listings?asset_contract_address=${GACC_COLLECTION_ADDRESS}&order_by=eth_price&order_direction=asc&limit=1`;
    const listingsResponse = await fetch(listingsUrl, {
      headers: { Accept: 'application/json', 'x-api-key': apiKey! },
    });

    if (listingsResponse.ok) {
      const listingsData = await listingsResponse.json();
      if (listingsData.orders?.[0]?.current_price) {
        const priceInEth = parseFloat(listingsData.orders[0].current_price) / 1e18;
        return NextResponse.json(
          { floorPrice: priceInEth, source: 'opensea_listings' },
          { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
        );
      }
    }

    return NextResponse.json({ error: 'Floor price not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch floor price', details: (error as Error).message },
      { status: 500 }
    );
  }
}
