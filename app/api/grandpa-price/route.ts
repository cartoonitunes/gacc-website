import { NextResponse } from 'next/server';

const GRANDPA_COIN_ADDRESS = '0x20BFd82E6AD6A39cf4bD1F803e662FC065cD3d5F';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

export async function GET() {
  try {
    const subgraphQuery = `{
      pools(
        where: {
          or: [
            {token0: "${WETH_ADDRESS}", token1: "${GRANDPA_COIN_ADDRESS.toLowerCase()}"},
            {token0: "${GRANDPA_COIN_ADDRESS.toLowerCase()}", token1: "${WETH_ADDRESS}"}
          ]
        },
        orderBy: totalValueLockedUSD,
        orderDirection: desc,
        first: 1
      ) {
        token0 { id }
        token1 { id }
        token0Price
        token1Price
      }
    }`;

    const subgraphResponse = await fetch(
      'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: subgraphQuery }),
      }
    );

    const result = await subgraphResponse.json();
    if (result.data?.pools?.length > 0) {
      const pool = result.data.pools[0];
      let priceInETH: number;
      if (pool.token0.id.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
        priceInETH = 1 / parseFloat(pool.token0Price);
      } else {
        priceInETH = parseFloat(pool.token1Price);
      }
      if (priceInETH && !isNaN(priceInETH) && isFinite(priceInETH)) {
        return NextResponse.json({ priceInETH }, {
          headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
        });
      }
    }

    const cgResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${GRANDPA_COIN_ADDRESS}&vs_currencies=eth`
    );
    const cgData = await cgResponse.json();
    const key = GRANDPA_COIN_ADDRESS.toLowerCase();
    if (cgData[key]?.eth) {
      return NextResponse.json({ priceInETH: cgData[key].eth }, {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
      });
    }

    return NextResponse.json({ error: 'Price not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
}
