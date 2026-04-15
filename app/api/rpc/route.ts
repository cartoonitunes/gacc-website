import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    return NextResponse.json({ error: 'RPC_URL not configured' }, { status: 500 });
  }

  try {
    const body = await req.text();
    const upstream = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await upstream.text();
    return new NextResponse(data, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'RPC proxy failed', details: (err as Error).message },
      { status: 502 }
    );
  }
}
