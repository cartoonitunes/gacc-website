// ipfs.io, dweb.link, w3s.link and cloudflare-ipfs.com switched to
// service-worker-only gateways, so plain <img src> requests to them fail.
export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

const IPFS_PATH_RE = /^https?:\/\/[^/]+\/ipfs\/(.+)$/i;

/** Rewrites ipfs:// URIs and /ipfs/ gateway URLs to a gateway that still serves content directly. */
export function toIpfsGateway(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('ipfs://')) {
    return IPFS_GATEWAY + url.slice('ipfs://'.length).replace(/^ipfs\//, '');
  }
  const match = url.match(IPFS_PATH_RE);
  if (match) return IPFS_GATEWAY + match[1];
  return url;
}
