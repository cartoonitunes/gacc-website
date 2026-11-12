'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import { GSWAP_ABI } from '@/lib/gswap/abi';
import { GSWAP_CONFIG, GRANDPA_TOKEN_ABI, isGSwapLive } from '@/lib/gswap/config';
import { holderMultiplierBps } from '@/lib/gswap/math';
import type { RawPrizes } from '@/lib/gswap/prizes';

export interface RoundResult {
  id: number;
  winner: string;
  prizeETH: bigint;
  participants: number;
  drawnAtBlock: number;
  // Bonus token / NFT prizes bundled into the round. Loaded only for the rounds that are displayed.
  bundle: RawPrizes | null;
  // False while any prize leg is still owed to the winner (auto-pay failed; the winner can claim()).
  // Null for rounds outside the displayed window.
  settled: boolean | null;
}

export interface ProtocolState {
  paused: boolean;
  feeBps: bigint;
  pot: bigint;
  // Permissionless ETH top-ups for the open round. Added to the prize at the draw, but held apart from
  // the pot, so they never count toward potThreshold.
  boost: bigint;
  // Token / NFT prizes queued for the open round (bundled into its draw).
  queued: RawPrizes;
  potThreshold: bigint;
  currentRound: number;
  participants: number;
  totalWeight: bigint;
  completedRounds: number;
  uniqueSwappers: number;
  history: RoundResult[];
}

export interface UserState {
  ethBalance: bigint;
  grandpaBalance: bigint;
  allowance: bigint;
  buyVolume: bigint;
  sellVolume: bigint;
  entryWeight: bigint;
  multiplierBps: bigint;
  swapCount: number;
}

export interface TaxState {
  bps: bigint;
  enabled: boolean;
  fromChain: boolean;
}

let sharedProvider: JsonRpcProvider | null = null;
export function getReadProvider(): JsonRpcProvider {
  if (!sharedProvider) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/api/rpc` : '/api/rpc';
    sharedProvider = new JsonRpcProvider(url, GSWAP_CONFIG.chainId, { staticNetwork: true });
  }
  return sharedProvider;
}

function toRawPrizes([tokens, amounts]: any, [nfts, ids]: any): RawPrizes {
  return {
    tokens: (tokens as string[]).map((address, i) => ({ address, amount: amounts[i] as bigint })),
    nfts: (nfts as string[]).map((address, i) => ({ address, tokenId: (ids[i] as bigint).toString() })),
  };
}

export function useGSwapData(account: string | null) {
  const provider = useMemo(() => (typeof window === 'undefined' ? null : getReadProvider()), []);
  const gswap = useMemo(
    () => (provider && GSWAP_CONFIG.gswap ? new Contract(GSWAP_CONFIG.gswap, GSWAP_ABI as any, provider) : null),
    [provider]
  );
  const token = useMemo(
    () => (provider ? new Contract(GSWAP_CONFIG.token, GRANDPA_TOKEN_ABI as any, provider) : null),
    [provider]
  );

  const [tax, setTax] = useState<TaxState>({ bps: GSWAP_CONFIG.fallbackBuyTaxBps, enabled: true, fromChain: false });
  const [protocol, setProtocol] = useState<ProtocolState | null>(null);
  const [user, setUser] = useState<UserState | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [loading, setLoading] = useState(true);
  const accountRef = useRef(account);
  accountRef.current = account;

  const loadTax = useCallback(async () => {
    if (!token) return;
    try {
      const [bps, enabled] = await Promise.all([token.BUY_TAX_BPS(), token.taxEnabled()]);
      setTax({ bps: bps as bigint, enabled: enabled as boolean, fromChain: true });
    } catch {
      // Keep the 6% fallback; overstating the tax only makes the minimum safer.
    }
  }, [token]);

  const loadProtocol = useCallback(async () => {
    if (!gswap) return;
    const [paused, feeBps, pot, potThreshold, round, completed, uniqueSwappers] = await Promise.all([
      gswap.paused(),
      gswap.feeBps(),
      gswap.pot(),
      gswap.potThreshold(),
      gswap.currentRound(),
      gswap.completedRounds(),
      gswap.uniqueSwappers(),
    ]);
    const [participants, totalWeight, boost, [qTokens, qAmounts], [qNfts, qIds]] = await Promise.all([
      gswap.getParticipantCount(round),
      gswap.totalSqrtWeight(round),
      gswap.getRoundBoost(round),
      gswap.getQueuedPrizesForRound(round),
      gswap.getQueuedNFTsForRound(round),
    ]);

    const n = Number(completed);
    const ids: number[] = [];
    for (let id = n; id >= 1 && ids.length < GSWAP_CONFIG.historyLimit; id--) ids.push(id);
    const shown = ids.slice(0, GSWAP_CONFIG.historyDisplay);
    const [results, bundles] = await Promise.all([
      Promise.all(ids.map((id) => gswap.getRoundResult(id))),
      Promise.all(shown.map((id) => Promise.all([gswap.getRoundPrizeTokens(id), gswap.getRoundPrizeNFTs(id), gswap.getRound(id)]))),
    ]);
    const history: RoundResult[] = results.map((r: any, i: number) => ({
      id: ids[i],
      winner: r[0] as string,
      prizeETH: r[1] as bigint,
      participants: Number(r[2]),
      drawnAtBlock: Number(r[3]),
      bundle: i < bundles.length ? toRawPrizes(bundles[i][0], bundles[i][1]) : null,
      settled: i < bundles.length ? Boolean((bundles[i][2] as any).settled) : null,
    }));

    setProtocol({
      paused,
      feeBps,
      pot,
      boost,
      queued: toRawPrizes([qTokens, qAmounts], [qNfts, qIds]),
      potThreshold,
      currentRound: Number(round),
      participants: Number(participants),
      totalWeight,
      completedRounds: n,
      uniqueSwappers: Number(uniqueSwappers),
      history,
    });
  }, [gswap]);

  const loadUser = useCallback(async () => {
    const acct = accountRef.current;
    if (!provider || !token || !acct) {
      setUser(null);
      return;
    }
    const [ethBalance, grandpaBalance] = await Promise.all([provider.getBalance(acct), token.balanceOf(acct)]);

    let next: UserState = {
      ethBalance,
      grandpaBalance,
      allowance: 0n,
      buyVolume: 0n,
      sellVolume: 0n,
      entryWeight: 0n,
      multiplierBps: holderMultiplierBps(grandpaBalance),
      swapCount: 0,
    };

    if (gswap) {
      const round = await gswap.currentRound();
      const [allowance, buyVolume, sellVolume, entryWeight, multiplierBps, swapCount] = await Promise.all([
        token.allowance(acct, GSWAP_CONFIG.gswap),
        gswap.buyVolume(round, acct),
        gswap.sellVolume(round, acct),
        gswap.getEntries(round, acct),
        gswap.getHolderMultiplier(acct),
        gswap.swapCount(acct),
      ]);
      next = { ...next, allowance, buyVolume, sellVolume, entryWeight, multiplierBps, swapCount: Number(swapCount) };
    }
    // Ignore a result for an account the user has since switched away from.
    if (accountRef.current === acct) setUser(next);
  }, [provider, token, gswap]);

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([loadTax(), loadProtocol(), loadUser()]);
    const failed = results.some((r) => r.status === 'rejected');
    if (failed) console.warn('GSwap refresh failed', results.filter((r) => r.status === 'rejected'));
    setNetworkError(failed);
    setLoading(false);
  }, [loadTax, loadProtocol, loadUser]);

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, GSWAP_CONFIG.pollMs);
    return () => clearInterval(id);
  }, [refresh]);

  // Reload user data immediately when the connected account changes.
  useEffect(() => {
    setUser(null);
    loadUser().catch(() => setNetworkError(true));
  }, [account, loadUser]);

  const wins = useMemo(() => {
    if (!protocol || !account) return { count: 0, totalETH: 0n };
    const me = account.toLowerCase();
    const mine = protocol.history.filter((r) => r.winner.toLowerCase() === me);
    return { count: mine.length, totalETH: mine.reduce((s, r) => s + r.prizeETH, 0n) };
  }, [protocol, account]);

  return { provider, live: isGSwapLive, tax, protocol, user, wins, loading, networkError, refresh };
}
