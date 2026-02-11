import { Contract, namehash, JsonRpcProvider, BrowserProvider, JsonRpcSigner } from 'ethers';

const SUBDOMAIN_CLAIMER_ADDRESS = '0x4E82641c6d4f24b066abF6E14DBB498476fcF656';
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const RESOLVER = '0xF29100983E058B709F3D539b0c765937B804AC15';
const NAMEWRAPPER_ADDRESS = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const PARENT_DOMAIN = 'thegrandpa.eth';

const SUBDOMAIN_CLAIMER_ABI = [
  { constant: true, inputs: [{ name: '_owner', type: 'address' }], name: 'currentLabelOf', outputs: [{ name: '', type: 'string' }], type: 'function' },
  { constant: false, inputs: [{ name: 'label', type: 'string' }], name: 'claim', outputs: [], type: 'function' },
  { constant: false, inputs: [], name: 'release', outputs: [], type: 'function' },
];

const ENS_REGISTRY_ABI = [
  { constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'resolver', outputs: [{ name: '', type: 'address' }], type: 'function' },
  { constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'owner', outputs: [{ name: '', type: 'address' }], type: 'function' },
];

const RESOLVER_ABI = [
  { constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'addr', outputs: [{ name: '', type: 'address' }], type: 'function' },
  { constant: true, inputs: [{ name: 'node', type: 'bytes32' }], name: 'name', outputs: [{ name: '', type: 'string' }], type: 'function' },
  { constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'addr', type: 'address' }], name: 'setAddr', outputs: [], type: 'function' },
  { constant: false, inputs: [{ name: 'node', type: 'bytes32' }, { name: 'coinType', type: 'uint256' }, { name: 'addr', type: 'bytes' }], name: 'setAddr', outputs: [], type: 'function' },
];

const NAMEWRAPPER_ABI = [
  { inputs: [{ name: 'node', type: 'bytes32' }, { name: 'resolver', type: 'address' }], name: 'setResolver', outputs: [], stateMutability: 'nonpayable', type: 'function' },
];

export type SubdomainState = 'NONE' | 'CLAIMED_NO_RESOLVER' | 'RESOLVER_SET_NO_ADDR' | 'FULLY_ACTIVE';

export async function reverseResolveENS(provider: JsonRpcProvider, address: string): Promise<string | null> {
  const addressLower = address.toLowerCase().replace('0x', '');
  const reverseName = `${addressLower.split('').reverse().join('')}.addr.reverse`;
  const reverseNode = namehash(reverseName);

  const registry = new Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
  const resolverAddr = await registry.resolver(reverseNode);

  if (!resolverAddr || resolverAddr === ZERO_ADDRESS) return null;

  const resolver = new Contract(resolverAddr, RESOLVER_ABI, provider);
  try {
    const name = await resolver.name(reverseNode);
    if (!name || name.trim() === '' || name === '0x') return null;

    try {
      const forwardAddr = await resolver.addr(namehash(name));
      if (forwardAddr.toLowerCase() !== address.toLowerCase()) return null;
    } catch {
      // forward verification failed, still return name
    }
    return name;
  } catch {
    return null;
  }
}

export async function getSubdomainState(
  label: string,
  account: string,
  provider: JsonRpcProvider | BrowserProvider
): Promise<SubdomainState> {
  try {
    const subdomainNode = namehash(`${label}.${PARENT_DOMAIN}`);
    const registry = new Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
    const resolverAddr = await registry.resolver(subdomainNode);

    if (!resolverAddr || resolverAddr === ZERO_ADDRESS) return 'CLAIMED_NO_RESOLVER';

    const resolver = new Contract(resolverAddr, RESOLVER_ABI, provider);
    const addr = await resolver.addr(subdomainNode);

    if (!addr || addr === ZERO_ADDRESS) return 'RESOLVER_SET_NO_ADDR';
    if (addr.toLowerCase() === account.toLowerCase()) return 'FULLY_ACTIVE';
    return 'RESOLVER_SET_NO_ADDR';
  } catch {
    return 'CLAIMED_NO_RESOLVER';
  }
}

export async function getCurrentLabel(provider: JsonRpcProvider | BrowserProvider, account: string): Promise<string | null> {
  const contract = new Contract(SUBDOMAIN_CLAIMER_ADDRESS, SUBDOMAIN_CLAIMER_ABI, provider);
  const label = await contract.currentLabelOf(account);
  const str = String(label).trim();
  if (str.length > 0 && str !== 'null' && str !== 'undefined') return str;
  return null;
}

export async function claimSubdomain(signer: JsonRpcSigner, label: string) {
  const contract = new Contract(SUBDOMAIN_CLAIMER_ADDRESS, SUBDOMAIN_CLAIMER_ABI, signer);
  return contract.claim(label);
}

export async function releaseSubdomain(signer: JsonRpcSigner) {
  const contract = new Contract(SUBDOMAIN_CLAIMER_ADDRESS, SUBDOMAIN_CLAIMER_ABI, signer);
  return contract.release();
}

export async function activateSubdomain(signer: JsonRpcSigner, label: string, account: string) {
  const subdomainNode = namehash(`${label}.${PARENT_DOMAIN}`);
  const provider = signer.provider!;

  const registry = new Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
  let resolverAddr: string = await registry.resolver(subdomainNode);

  const needsResolver = !resolverAddr || resolverAddr === ZERO_ADDRESS || resolverAddr.toLowerCase() !== RESOLVER.toLowerCase();

  if (needsResolver) {
    const nameWrapper = new Contract(NAMEWRAPPER_ADDRESS, NAMEWRAPPER_ABI, signer);
    const tx = await nameWrapper.setResolver(subdomainNode, RESOLVER);
    await tx.wait();
    resolverAddr = RESOLVER;
  }

  const resolver = new Contract(resolverAddr, RESOLVER_ABI, signer);
  try {
    const tx = await resolver.setAddr(subdomainNode, account);
    await tx.wait();
  } catch {
    const coinType = 60;
    const { AbiCoder } = await import('ethers');
    const coder = new AbiCoder();
    const addrBytes = coder.encode(['address'], [account]);
    const tx = await resolver['setAddr(bytes32,uint256,bytes)'](subdomainNode, coinType, addrBytes);
    await tx.wait();
  }
}

export function validateEnsLabel(label: string): { valid: boolean; error?: string } {
  if (!label || label.trim().length === 0) return { valid: false, error: 'Subdomain name cannot be empty' };
  const t = label.trim();
  if (t.length > 63) return { valid: false, error: 'Must be 63 characters or less' };
  if (!/^[a-z0-9-]+$/i.test(t)) return { valid: false, error: 'Only letters, numbers, and hyphens allowed' };
  if (t.startsWith('-') || t.endsWith('-')) return { valid: false, error: 'Cannot start or end with a hyphen' };
  if (t.includes('--')) return { valid: false, error: 'Cannot have consecutive hyphens' };
  if (/^\d+$/.test(t)) return { valid: false, error: 'Cannot be only numbers' };
  return { valid: true };
}
