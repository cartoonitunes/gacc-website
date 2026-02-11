import { NextRequest, NextResponse } from 'next/server';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import wl from '@/data/whitelist/wl.json';
import wlMulti from '@/data/whitelist/wl-multi.json';
import wlFree from '@/data/whitelist/wl-free.json';
import wlFreeMulti from '@/data/whitelist/wl-free-multi.json';

function buildTree(addresses: string[]) {
  const leaves = addresses.map(addr => keccak256(addr));
  return new MerkleTree(leaves, keccak256, { sortPairs: true });
}

const trees: Record<string, MerkleTree> = {
  WL: buildTree(wl),
  MULTI: buildTree(wlMulti),
  FREE: buildTree(wlFree),
  FREE_MULTI: buildTree(wlFreeMulti),
};

export async function POST(request: NextRequest) {
  try {
    const { address, wlType } = await request.json();
    const tree = trees[wlType];
    if (!tree) {
      return NextResponse.json('Failed attempt', { status: 422 });
    }
    const hashedAddress = keccak256(address);
    const proof = tree.getHexProof(hashedAddress);
    if (!proof) {
      return NextResponse.json('Failed attempt', { status: 422 });
    }
    return NextResponse.json(proof);
  } catch {
    return NextResponse.json('Something went wrong!', { status: 422 });
  }
}
