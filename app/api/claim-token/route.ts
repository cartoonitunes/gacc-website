import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { JsonRpcProvider, Contract } from 'ethers';
import mutantAbi from '@/data/abi/mutant.json';

export async function POST(request: NextRequest) {
  try {
    const { address, token: rawToken } = await request.json();
    const token = String(rawToken);
    const intToken = parseInt(token);
    if (!/^\d+$/.test(token) || intToken < 0 || intToken > 15020) {
      return NextResponse.json({ success: false, msg: 'Invalid token id' }, { status: 404 });
    }

    const existing = await kv.get<boolean>(`tokens:${token}`);
    if (existing) {
      return NextResponse.json({ success: false, msg: 'Token was already claimed!' });
    }

    const provider = new JsonRpcProvider(process.env.INFURA_URL);
    const contract = new Contract(process.env.NEXT_PUBLIC_MACC_ADDRESS!, mutantAbi, provider);

    let owner: string;
    try {
      owner = await contract.ownerOf(intToken);
    } catch {
      return NextResponse.json({ success: false, msg: 'This token does not exist yet!' }, { status: 404 });
    }

    if (owner === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json({ success: false, msg: 'This token does not exist yet!' }, { status: 404 });
    }

    const wasSet = await kv.setnx(`tokens:${token}`, true);
    if (!wasSet) {
      return NextResponse.json({ success: false, msg: 'Token was already claimed!' });
    }
    await kv.set(`tokens:${token}:address`, address);

    return NextResponse.json({ success: true, msg: `Token ${token} claimed by ${address}` });
  } catch {
    return NextResponse.json({ success: false, msg: 'Something went wrong!' }, { status: 422 });
  }
}
