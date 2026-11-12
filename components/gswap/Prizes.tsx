'use client';

import { useEffect, useState } from 'react';
import type { JsonRpcProvider } from 'ethers';
import { GSWAP_CONFIG } from '@/lib/gswap/config';
import {
  formatTokenPrizeAmount,
  resolveNftPrizes,
  resolveTokenPrizes,
  type NftPrize,
  type RawPrizes,
  type TokenPrize,
} from '@/lib/gswap/prizes';
import { shortAddr } from '@/lib/gswap/format';
import { EthIcon, GrandpaIcon, Skeleton } from './ui';

// ---------------------------------------------------------------------------
// Resolution

function rawKey(raw: RawPrizes | null | undefined): string {
  if (!raw) return '';
  return [...raw.tokens.map((t) => `t:${t.address}:${t.amount}`), ...raw.nfts.map((n) => `n:${n.address}:${n.tokenId}`)].join('|');
}

/** Resolves raw prize addresses to display data. Keyed on content, so polling does not refetch. */
export function useResolvedPrizes(provider: JsonRpcProvider | null, raw: RawPrizes | null | undefined) {
  const key = rawKey(raw);
  const [state, setState] = useState<{ key: string; tokens: TokenPrize[] | null; nfts: NftPrize[] | null; mediaDone: boolean } | null>(null);

  useEffect(() => {
    if (!provider || !raw || key === '') return;
    let cancelled = false;
    const patch = (p: Partial<{ tokens: TokenPrize[]; nfts: NftPrize[]; mediaDone: boolean }>) => {
      if (cancelled) return;
      setState((prev) => ({ ...(prev && prev.key === key ? prev : { key, tokens: null, nfts: null, mediaDone: false }), ...p }));
    };
    resolveTokenPrizes(provider, raw.tokens).then((tokens) => patch({ tokens }));
    resolveNftPrizes(provider, raw.nfts, (nfts) => patch({ nfts })).then((nfts) => patch({ nfts, mediaDone: true }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, key]);

  const cur = state && state.key === key ? state : null;
  return {
    tokens: cur?.tokens ?? [],
    nfts: cur?.nfts ?? [],
    // Tiles render once both lists are known; NFT images keep loading inside their tiles.
    loading: key !== '' && !(cur?.tokens && cur?.nfts),
    mediaLoading: key !== '' && !cur?.mediaDone,
  };
}

// ---------------------------------------------------------------------------
// Pieces

export function TokenIcon({ prize, size = 24 }: { prize: Pick<TokenPrize, 'address' | 'symbol'>; size?: number }) {
  const addr = prize.address.toLowerCase();
  const dim = { width: size, height: size };
  if (addr === GSWAP_CONFIG.token.toLowerCase()) return <span style={dim} className="inline-flex shrink-0"><GrandpaIcon className="w-full h-full" /></span>;
  if (addr === GSWAP_CONFIG.weth.toLowerCase()) return <span style={dim} className="inline-flex shrink-0"><EthIcon className="w-full h-full" /></span>;
  const label = (prize.symbol ?? '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || '?';
  return (
    <span
      style={{ ...dim, fontSize: Math.max(8, Math.round(size * 0.32)) }}
      className="rounded-full shrink-0 inline-flex items-center justify-center bg-gradient-to-br from-gs-glint to-gs-amber text-gs-night font-black ring-1 ring-gs-line"
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

function NftImage({ nft, className, compact = false, pending = false }: { nft: NftPrize; className: string; compact?: boolean; pending?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (pending && !nft.image) return <span className={`${className} gswap-skeleton block !rounded-none`} aria-hidden="true" />;
  if (nft.image && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={nft.image} alt={nft.name ?? `${nft.collection ?? 'NFT'} #${nft.tokenId}`} loading="lazy" onError={() => setFailed(true)} className={className} />;
  }
  if (compact) {
    return <span className={`${className} flex items-center justify-center bg-gs-raised text-[10px]`} aria-hidden="true">🖼️</span>;
  }
  return (
    <span className={`${className} flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-gs-raised to-gs-ink text-gs-muted`}>
      <span className="text-2xl" aria-hidden="true">🖼️</span>
      <span className="text-[11px] font-bold tabular-nums truncate max-w-[90%]">#{nft.tokenId}</span>
    </span>
  );
}

function TileFrame({ href, badge, media, title, sub }: { href: string; badge: string; media: React.ReactNode; title: string; sub: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-2xl bg-gs-ink/60 ring-1 ring-gs-line hover:ring-gs-glint/60 overflow-hidden flex flex-col transition-[box-shadow,transform] hover:-translate-y-0.5"
    >
      <div className="relative aspect-square overflow-hidden">
        {media}
        <span className="absolute top-2 left-2 rounded-full bg-gs-ink/80 backdrop-blur px-2 py-0.5 text-[10px] font-extrabold tracking-[0.14em] text-gs-glint ring-1 ring-gs-glint/30">
          {badge}
        </span>
      </div>
      <div className="px-3 py-2.5 min-w-0">
        <p className="text-sm font-extrabold truncate" title={title}>
          {title}
        </p>
        <p className="text-xs text-gs-muted truncate" title={sub}>
          {sub}
        </p>
      </div>
    </a>
  );
}

function NftTile({ nft, pending }: { nft: NftPrize; pending: boolean }) {
  const title = nft.name ?? `${nft.collection ?? 'NFT'} #${nft.tokenId}`;
  const sub = [nft.name ? nft.collection : null, `#${nft.tokenId}`].filter(Boolean).join(' · ');
  return (
    <TileFrame
      href={`https://opensea.io/assets/ethereum/${nft.address}/${nft.tokenId}`}
      badge="NFT"
      media={<NftImage nft={nft} pending={pending} className="w-full h-full object-cover bg-gs-ink transition-transform duration-500 group-hover:scale-105" />}
      title={title}
      sub={sub}
    />
  );
}

function TokenTile({ token }: { token: TokenPrize }) {
  const amount = formatTokenPrizeAmount(token);
  const symbol = token.symbol ?? shortAddr(token.address);
  return (
    <TileFrame
      href={`${GSWAP_CONFIG.explorer}/token/${token.address}`}
      badge="TOKEN"
      media={
        <span className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_40%,rgba(214,171,103,0.28),transparent_65%)] bg-gs-ink">
          <TokenIcon prize={token} size={64} />
          <span className="px-2 text-center text-xl font-black italic gswap-gold-text tabular-nums leading-tight break-all">{amount}</span>
        </span>
      }
      title={`${amount} ${symbol}`}
      sub={token.symbol ? 'Token prize' : token.address}
    />
  );
}

// ---------------------------------------------------------------------------
// Showcase for the open round

function extrasSummary(tokens: number, nfts: number): string {
  const parts = [];
  if (nfts) parts.push(`${nfts} NFT${nfts === 1 ? '' : 's'}`);
  if (tokens) parts.push(`${tokens} token${tokens === 1 ? '' : 's'}`);
  return parts.join(', ');
}

export function PrizeShowcase({
  provider,
  raw,
  ethCard,
}: {
  provider: JsonRpcProvider | null;
  raw: RawPrizes;
  ethCard: React.ReactNode;
}) {
  const { tokens, nfts, loading, mediaLoading } = useResolvedPrizes(provider, raw);
  const count = raw.tokens.length + raw.nfts.length;

  if (count === 0) return <>{ethCard}</>;

  // NFTs lead (they are the most visual), then tokens, in the order they were queued.
  const tiles = loading
    ? Array.from({ length: count }, (_, i) => <Skeleton key={`s${i}`} className="aspect-square w-full rounded-2xl" />)
    : [...nfts.map((n) => <NftTile key={`n:${n.address}:${n.tokenId}`} nft={n} pending={mediaLoading} />), ...tokens.map((t, i) => <TokenTile key={`t:${t.address}:${i}`} token={t} />)];

  const cols = count === 1 ? 'grid-cols-1 max-w-[260px]' : count === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 lg:gap-8 items-start">
      <div>{ethCard}</div>
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gs-muted whitespace-nowrap">Plus bonus prizes</p>
          <p className="text-xs text-gs-glint font-bold">{extrasSummary(raw.tokens.length, raw.nfts.length)}</p>
        </div>
        <div className={`grid ${cols} gap-3`}>{tiles}</div>
        <p className="mt-3 text-xs text-gs-muted">The winner takes the ETH and every bonus prize together.</p>
      </div>
    </div>
  );
}

/** Short headline for the hero chip, e.g. "+ 2 NFTs, 1 token". */
export function extrasChipText(raw: RawPrizes | null | undefined): string | null {
  if (!raw) return null;
  const n = raw.nfts.length;
  const t = raw.tokens.length;
  if (n + t === 0) return null;
  return `+ ${[n ? `${n} NFT${n === 1 ? '' : 's'}` : null, t ? `${t} token${t === 1 ? '' : 's'}` : null].filter(Boolean).join(', ')}`;
}

// ---------------------------------------------------------------------------
// Compact chips for past winners

export function PrizeChips({ provider, raw }: { provider: JsonRpcProvider | null; raw: RawPrizes | null }) {
  const { tokens, nfts, loading, mediaLoading } = useResolvedPrizes(provider, raw);
  const count = raw ? raw.tokens.length + raw.nfts.length : 0;
  if (count === 0) return null;
  if (loading) return <Skeleton className="h-6 w-28 rounded-full" />;
  return (
    <span className="flex flex-wrap gap-1.5">
      {nfts.map((n) => (
        <a
          key={`n:${n.address}:${n.tokenId}`}
          href={`https://opensea.io/assets/ethereum/${n.address}/${n.tokenId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full bg-gs-ink/70 ring-1 ring-gs-line hover:ring-gs-glint/50 pl-0.5 pr-2.5 py-0.5 text-xs font-bold max-w-[180px]"
          title={n.name ?? `${n.collection ?? 'NFT'} #${n.tokenId}`}
        >
          <NftImage nft={n} compact pending={mediaLoading} className="w-5 h-5 rounded-full object-cover shrink-0 overflow-hidden" />
          <span className="truncate">{n.name ?? `${n.collection ?? 'NFT'} #${n.tokenId}`}</span>
        </a>
      ))}
      {tokens.map((t, i) => (
        <span key={`t:${t.address}:${i}`} className="flex items-center gap-1.5 rounded-full bg-gs-ink/70 ring-1 ring-gs-line pl-0.5 pr-2.5 py-0.5 text-xs font-bold">
          <TokenIcon prize={t} size={20} />
          {formatTokenPrizeAmount(t)} {t.symbol ?? shortAddr(t.address)}
        </span>
      ))}
    </span>
  );
}
