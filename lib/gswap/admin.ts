import { getAddress } from 'ethers';
import { GSWAP_ABI } from './abi';

// Prize manager additions in the updated GSwap.sol (um-raffle, Nov 11 2026), added by hand until
// lib/gswap/abi.ts is regenerated from the final artifact. Compiling that source and diffing its ABI
// against abi.ts showed exactly these six additions and no other changes. On a contract without them,
// prizeManager() reverts and the UI treats the wallet as not a prize manager.
export const PRIZE_MANAGER_ABI = [
  'function addPrizeManager(address manager)',
  'function removePrizeManager(address manager)',
  'function prizeManager(address manager) view returns (bool)',
  'event PrizeManagerAdded(address indexed manager)',
  'event PrizeManagerRemoved(address indexed manager)',
  'error NotPrizeManager()',
] as const;

export const GSWAP_ADMIN_ABI = [...(GSWAP_ABI as readonly unknown[]), ...PRIZE_MANAGER_ABI] as any;

export const ERC20_ADMIN_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
] as const;

export const ERC721_ADMIN_ABI = [
  'function ownerOf(uint256) view returns (address)',
  'function getApproved(uint256) view returns (address)',
  'function isApprovedForAll(address,address) view returns (bool)',
  'function approve(address,uint256)',
  'function supportsInterface(bytes4) view returns (bool)',
] as const;

export const ERC721_INTERFACE_ID = '0x80ac58cd';

/** Checksummed address, or null if the input is not a valid address. */
export function parseAddressInput(raw: string): string | null {
  const v = raw.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return null;
  const hex = v.slice(2);
  const singleCase = hex === hex.toLowerCase() || hex === hex.toUpperCase();
  try {
    // Mixed case must carry a valid EIP-55 checksum; a bad one is likely a typo, so it is rejected.
    return getAddress(singleCase ? `0x${hex.toLowerCase()}` : v);
  } catch {
    return null;
  }
}

// Fallback only: if the PrizeManagerAdded/Removed log query fails (for example an RPC that limits
// eth_getLogs), the panel lists managers added from this browser, each re-checked onchain.
const knownKey = (gswap: string) => `gswap:prizeManagers:${gswap.toLowerCase()}`;

export function loadKnownManagers(gswap: string): string[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(knownKey(gswap)) ?? '[]');
    return Array.isArray(raw) ? raw.map((a) => parseAddressInput(String(a))).filter((a): a is string => !!a) : [];
  } catch {
    return [];
  }
}

export function saveKnownManagers(gswap: string, list: string[]): void {
  const unique = Array.from(new Set(list.map((a) => getAddress(a))));
  window.localStorage.setItem(knownKey(gswap), JSON.stringify(unique));
}
