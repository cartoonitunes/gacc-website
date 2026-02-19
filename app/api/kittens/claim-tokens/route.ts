import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

export async function POST(request: NextRequest) {
  try {
    const { tokens: rawTokens } = await request.json();
    const tokens = (rawTokens as unknown[]).map(Number);
    const isValid = tokens.every(t => !isNaN(t) && t >= 0 && t <= 2221);
    if (!isValid) {
      return NextResponse.json({ success: false, msg: 'Invalid token IDs' }, { status: 400 });
    }

    const unclaimed: number[] = [];
    for (const t of tokens) {
      const existing = await kv.get<boolean>(`kittens:${t}`);
      if (!existing) unclaimed.push(t);
    }

    if (unclaimed.length === 0) {
      return NextResponse.json({ success: true, msg: 'All of the requested kittens have already been claimed.' });
    }

    for (const t of unclaimed) {
      await kv.setnx(`kittens:${t}`, true);
    }

    return NextResponse.json({
      success: true,
      msg: `Revealed ${unclaimed.length} kitten(s): ${unclaimed.join(', ')}`,
    });
  } catch {
    return NextResponse.json({ success: false, msg: 'Something went wrong!' }, { status: 422 });
  }
}
