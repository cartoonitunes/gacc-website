import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';

const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

const CONTRACTS: Record<string, string> = {
  GACC: process.env.NEXT_PUBLIC_GACC_ADDRESS || '0xb73B1335C1f14ECCD0D6787490bCe85e1af62378',
  MACC: process.env.NEXT_PUBLIC_MACC_ADDRESS || '0xAD0db7368CDFbd3153F7dfaCA51A78Eeb39F6d71',
  KITTENS: process.env.NEXT_PUBLIC_KITTEN_ADDRESS || '0xAAb6E53554e56513FE5825738C950Bd3812B38c6',
};

async function getNFTsForWallet(wallet: string): Promise<any[]> {
  const contractAddresses = Object.values(CONTRACTS);
  const url = `${ALCHEMY_URL}/getNFTsForOwner?owner=${wallet}&contractAddresses[]=${contractAddresses.join('&contractAddresses[]=')}&withMetadata=true`;

  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.ownedNfts || [];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const discordId = (session.user as any).discordId;
  const pool = getPool();

  try {
    const memberRes = await pool.query(
      'SELECT id FROM members_member WHERE discord_id = $1',
      [discordId]
    );
    if (memberRes.rows.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const walletRes = await pool.query(
      'SELECT wallet FROM members_memberwallets WHERE member_id = $1',
      [memberRes.rows[0].id]
    );

    const wallets: string[] = walletRes.rows.map((r: any) => r.wallet);
    if (wallets.length === 0) {
      return NextResponse.json({ gacc: [], macc: [], kittens: [] });
    }

    const allNfts: any[] = [];
    for (const wallet of wallets) {
      const nfts = await getNFTsForWallet(wallet);
      allNfts.push(...nfts);
    }

    const contractToKey: Record<string, string> = {};
    for (const [key, addr] of Object.entries(CONTRACTS)) {
      contractToKey[addr.toLowerCase()] = key.toLowerCase();
    }

    const collection: Record<string, any[]> = { gacc: [], macc: [], kittens: [] };

    for (const nft of allNfts) {
      const addr = (nft.contract?.address || '').toLowerCase();
      const key = contractToKey[addr];
      if (key) {
        collection[key].push({
          tokenId: nft.tokenId || nft.id?.tokenId,
          name: nft.title || nft.name || nft.metadata?.name || `#${nft.tokenId || nft.id?.tokenId}`,
          image: nft.media?.[0]?.gateway || nft.media?.[0]?.raw || nft.metadata?.image || null,
        });
      }
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Collection query error:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}
