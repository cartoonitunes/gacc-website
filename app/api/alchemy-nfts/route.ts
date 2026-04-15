import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    return NextResponse.json({ error: 'RPC_URL not configured' }, { status: 500 });
  }

  const key = rpcUrl.split('/').pop();
  if (!key) {
    return NextResponse.json({ error: 'Invalid RPC_URL' }, { status: 500 });
  }

  try {
    const search = req.nextUrl.search;
    const upstream = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/${key}/getNFTsForOwner${search}`
    );
    const data = await upstream.text();
    return new NextResponse(data, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Alchemy NFT proxy failed', details: (err as Error).message },
      { status: 502 }
    );
  }
}
