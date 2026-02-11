import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { JsonRpcProvider, Contract } from 'ethers';
import kittenAbi from '@/data/abi/kitten.json';

export async function POST(request: NextRequest) {
  try {
    const { address, tokens: rawTokens } = await request.json();
    const tokens = (rawTokens as unknown[]).map(Number);
    const isValid = tokens.every(t => !isNaN(t) && t >= 0 && t <= 2221);
    if (!isValid) {
      return NextResponse.json({ success: false, msg: 'Invalid token IDs' }, { status: 404 });
    }

    const provider = new JsonRpcProvider(process.env.ALCHEMY_URL);
    const contract = new Contract(process.env.NEXT_PUBLIC_KITTEN_ADDRESS!, kittenAbi, provider);

    const unclaimed: string[] = [];
    for (const t of tokens) {
      const key = `kittens:${t}`;
      const existing = await kv.get<boolean>(key);
      if (!existing) unclaimed.push(String(t));
    }

    if (unclaimed.length === 0) {
      return NextResponse.json({ success: true, msg: 'All of the requested kittens have already been claimed.' });
    }

    for (const t of unclaimed) {
      try {
        await contract.ownerOf(parseInt(t));
      } catch {
        return NextResponse.json(
          { success: false, msg: `GAKC #${parseInt(t)} does not exist yet!` },
          { status: 404 }
        );
      }
    }

    for (const t of unclaimed) {
      const wasSet = await kv.setnx(`kittens:${t}`, true);
      if (wasSet) {
        await kv.set(`kittens:${t}:address`, address);
      }
    }

    return NextResponse.json({
      success: true,
      msg: `The requested kittens have been claimed by ${address}`,
    });
  } catch {
    return NextResponse.json({ success: false, msg: 'Something went wrong!' }, { status: 422 });
  }
}
