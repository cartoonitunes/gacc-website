import { Contract, formatUnits, type Provider } from 'ethers';
import { toIpfsGateway } from '@/lib/ipfs';

// Prize resolution, modelled on the Unicorn Meat Cauldron page (unicornmeat-website/assets/js/cauldron/
// contract.js): ERC-721 prizes resolve onchain via name() + tokenURI(), handling ipfs:// and data: URIs,
// and every lookup is best-effort so a prize always renders, with a placeholder if nothing resolves.
// Differences: IPFS goes through a gateway that still serves files (ipfs.io no longer does), and NFTs
// whose metadata cannot be read from the browser (CORS, dead hosts) fall back to the server-side
// /api/nft-metadata-batch route.

export interface TokenPrize {
  address: string;
  symbol: string | null;
  decimals: number | null;
  amount: bigint;
}

export interface NftPrize {
  address: string;
  tokenId: string;
  collection: string | null;
  name: string | null;
  image: string | null;
}

export interface RawPrizes {
  tokens: { address: string; amount: bigint }[];
  nfts: { address: string; tokenId: string }[];
}

const ERC20_META_ABI = ['function symbol() view returns (string)', 'function decimals() view returns (uint8)'];
const ERC721_META_ABI = ['function name() view returns (string)', 'function tokenURI(uint256) view returns (string)'];

const FETCH_TIMEOUT_MS = 8_000;

// Metadata never changes for a given token, so resolve each one once per page load.
const tokenMetaCache = new Map<string, Promise<{ symbol: string | null; decimals: number | null }>>();
const nftCache = new Map<string, Promise<NftPrize>>();

/** Only https and inline images are rendered from untrusted NFT metadata. */
function safeImageUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw) return null;
  const url = toIpfsGateway(raw.trim());
  if (!url) return null;
  if (url.startsWith('https://') || url.startsWith('data:image/')) return url;
  if (url.startsWith('ar://')) return `https://arweave.net/${url.slice(5)}`;
  return null;
}

async function fetchJson(url: string): Promise<any | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function readTokenUriJson(uriRaw: string | null): Promise<any | null> {
  if (!uriRaw) return null;
  const uri = uriRaw.trim();
  try {
    if (uri.startsWith('data:application/json;base64,')) {
      return JSON.parse(atob(uri.slice('data:application/json;base64,'.length)));
    }
    if (uri.startsWith('data:application/json;utf8,')) {
      return JSON.parse(uri.slice('data:application/json;utf8,'.length));
    }
    if (uri.startsWith('data:application/json,')) {
      return JSON.parse(decodeURIComponent(uri.slice('data:application/json,'.length)));
    }
  } catch {
    return null;
  }
  const url = safeImageUrl(uri) ?? (uri.startsWith('ipfs://') ? toIpfsGateway(uri) : null);
  return url && url.startsWith('https://') ? fetchJson(url) : null;
}

function resolveTokenMeta(provider: Provider, address: string) {
  const key = address.toLowerCase();
  let p = tokenMetaCache.get(key);
  if (!p) {
    const c = new Contract(address, ERC20_META_ABI, provider);
    p = Promise.all([c.symbol().catch(() => null), c.decimals().catch(() => null)]).then(([symbol, decimals]) => ({
      symbol: typeof symbol === 'string' && symbol.length > 0 && symbol.length <= 20 ? symbol : null,
      decimals: decimals === null ? null : Number(decimals),
    }));
    tokenMetaCache.set(key, p);
  }
  return p;
}

interface NftBasics extends NftPrize {
  uri: string | null;
}

/** Fast pass: one RPC round trip for the collection name and tokenURI. */
async function resolveNftBasics(provider: Provider, address: string, tokenId: string): Promise<NftBasics> {
  const c = new Contract(address, ERC721_META_ABI, provider);
  const [collection, uri] = await Promise.all([c.name().catch(() => null), c.tokenURI(tokenId).catch(() => null)]);
  return {
    address,
    tokenId,
    collection: typeof collection === 'string' && collection ? collection : null,
    name: null,
    image: null,
    uri: typeof uri === 'string' ? uri : null,
  };
}

/** Slow pass: read the metadata JSON (onchain data: URI, IPFS or https) for the name and image. */
async function resolveNftMedia(basics: NftBasics): Promise<NftPrize> {
  const entry: NftPrize = { address: basics.address, tokenId: basics.tokenId, collection: basics.collection, name: null, image: null };
  const json = await readTokenUriJson(basics.uri);
  if (json && typeof json === 'object') {
    entry.name = typeof json.name === 'string' && json.name ? json.name : null;
    entry.image = safeImageUrl(json.image ?? json.image_url ?? json.image_data ?? null);
  }
  return entry;
}

async function fillFromServer(entries: NftPrize[]): Promise<void> {
  const missing = entries.filter((e) => !e.image);
  if (missing.length === 0) return;
  try {
    const res = await fetch('/api/nft-metadata-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nfts: missing.map((e) => ({ contractAddress: e.address, tokenId: e.tokenId })) }),
    });
    if (!res.ok) return;
    const data = await res.json();
    for (const r of data.results ?? []) {
      const e = missing.find((m) => m.address.toLowerCase() === String(r.contractAddress).toLowerCase() && m.tokenId === String(r.tokenId));
      if (!e) continue;
      e.image = safeImageUrl(r.metadata?.image);
      e.name = e.name ?? (typeof r.metadata?.name === 'string' ? r.metadata.name : null);
    }
  } catch {
    /* placeholder */
  }
}

export async function resolveTokenPrizes(provider: Provider, tokens: RawPrizes['tokens']): Promise<TokenPrize[]> {
  return Promise.all(
    tokens.map(async (t) => {
      const meta = await resolveTokenMeta(provider, t.address);
      return { address: t.address, amount: t.amount, ...meta };
    })
  );
}

/**
 * Resolves NFT prizes in two passes so tiles never wait on slow metadata hosts: `onBasics` fires as soon
 * as the collection names are known (one RPC round trip), and the returned promise resolves once the
 * names and images are in. Finished results are cached for the page's lifetime.
 */
export async function resolveNftPrizes(
  provider: Provider,
  nfts: RawPrizes['nfts'],
  onBasics?: (partial: NftPrize[]) => void
): Promise<NftPrize[]> {
  const keys = nfts.map((n) => `${n.address.toLowerCase()}:${n.tokenId}`);
  if (keys.every((k) => nftCache.has(k))) return Promise.all(keys.map((k) => nftCache.get(k)!));

  const basics = await Promise.all(nfts.map((n) => resolveNftBasics(provider, n.address, n.tokenId).catch(() => null)));
  const partial: NftPrize[] = basics.map((b, i) => {
    const base = b ?? { address: nfts[i].address, tokenId: nfts[i].tokenId, collection: null, name: null, image: null, uri: null };
    return { address: base.address, tokenId: base.tokenId, collection: base.collection, name: null, image: null };
  });
  onBasics?.(partial);

  const full = (async () => {
    const media = await Promise.all(
      basics.map((b, i) => (b ? resolveNftMedia(b).catch(() => partial[i]) : Promise.resolve(partial[i])))
    );
    await fillFromServer(media);
    return media;
  })();
  keys.forEach((k, i) => nftCache.set(k, full.then((m) => m[i])));
  return full;
}

export function formatTokenPrizeAmount(t: TokenPrize): string {
  if (t.decimals === null) return `${t.amount.toString()} units`;
  const n = Number(formatUnits(t.amount, t.decimals));
  if (n >= 100_000) return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: n >= 1 ? 2 : 6 }).format(n);
}

export function prizeCount(p: RawPrizes | null | undefined): number {
  return p ? p.tokens.length + p.nfts.length : 0;
}
