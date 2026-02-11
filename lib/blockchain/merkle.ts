import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import wlAddresses from '@/data/whitelist/wl.json';
import wlMultiAddresses from '@/data/whitelist/wl-multi.json';
import wlFreeAddresses from '@/data/whitelist/wl-free.json';
import wlFreeMultiAddresses from '@/data/whitelist/wl-free-multi.json';

function buildTree(addresses: string[]) {
  const leaves = addresses.map((addr) => keccak256(addr));
  return new MerkleTree(leaves, keccak256, { sortPairs: true });
}

const trees: Record<string, MerkleTree> = {
  wl: buildTree(wlAddresses),
  wlMulti: buildTree(wlMultiAddresses),
  wlFree: buildTree(wlFreeAddresses),
  wlFreeMulti: buildTree(wlFreeMultiAddresses),
};

export function getProof(address: string, wlType: string): string[] {
  const tree = trees[wlType];
  if (!tree) return [];
  const leaf = keccak256(address);
  return tree.getHexProof(leaf);
}

export function getRoot(wlType: string): string {
  const tree = trees[wlType];
  if (!tree) return '';
  return tree.getHexRoot();
}

export function verify(address: string, wlType: string): boolean {
  const tree = trees[wlType];
  if (!tree) return false;
  const leaf = keccak256(address);
  const proof = tree.getHexProof(leaf);
  return tree.verify(proof, leaf, tree.getRoot());
}
