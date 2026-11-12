'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract, type JsonRpcProvider } from 'ethers';
import { GSWAP_ADMIN_ABI } from '@/lib/gswap/admin';
import { GSWAP_CONFIG } from '@/lib/gswap/config';
import { describeTxError } from '@/lib/gswap/errors';

export interface AdminState {
  owner: string;
  isOwner: boolean;
  isManager: boolean;
  // false when the deployed contract predates prize managers (prizeManager() reverts).
  managersSupported: boolean;
  feeBps: bigint;
  pendingFeeBps: bigint;
  maxFeeBps: bigint;
  pot: bigint;
  potThreshold: bigint;
  minPotThreshold: bigint;
  paused: boolean;
  currentRound: number;
  participants: number;
}

/** Reads the connected wallet's admin role and the settings the panel edits. Null until loaded or for non-admins. */
export function useAdminState(provider: JsonRpcProvider | null, account: string | null) {
  const [state, setState] = useState<AdminState | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  // Poll like the rest of the page, so warnings that depend on live state (for example whether a fee
  // change will be queued because the round already has players) are never based on stale data.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') setTick((n) => n + 1);
    }, GSWAP_CONFIG.pollMs);
    return () => clearInterval(t);
  }, []);

  const gswap = useMemo(
    () => (provider && GSWAP_CONFIG.gswap ? new Contract(GSWAP_CONFIG.gswap, GSWAP_ADMIN_ABI, provider) : null),
    [provider]
  );

  useEffect(() => {
    if (!gswap || !account) {
      setState(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [owner, managerFlag] = await Promise.all([
          gswap.owner() as Promise<string>,
          (gswap.prizeManager(account) as Promise<boolean>).then((v) => ({ ok: true, v })).catch(() => ({ ok: false, v: false })),
        ]);
        const isOwner = owner.toLowerCase() === account.toLowerCase();
        if (!isOwner && !managerFlag.v) {
          if (!cancelled) setState(null);
          return;
        }
        const round = await gswap.currentRound();
        const [feeBps, pendingFeeBps, maxFeeBps, pot, potThreshold, minPotThreshold, paused, participants] = await Promise.all([
          gswap.feeBps(),
          gswap.pendingFeeBps(),
          gswap.MAX_FEE_BPS(),
          gswap.pot(),
          gswap.potThreshold(),
          gswap.MIN_POT_THRESHOLD(),
          gswap.paused(),
          gswap.getParticipantCount(round),
        ]);
        if (cancelled) return;
        setState({
          owner,
          isOwner,
          isManager: managerFlag.v,
          managersSupported: managerFlag.ok,
          feeBps,
          pendingFeeBps,
          maxFeeBps,
          pot,
          potThreshold,
          minPotThreshold,
          paused,
          currentRound: Number(round),
          participants: Number(participants),
        });
      } catch (err) {
        console.warn('Admin state load failed', err);
        if (!cancelled) setState(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gswap, account, tick]);

  return { admin: state, refresh, readGswap: gswap };
}

export type ActionStatus =
  | { kind: 'idle' }
  | { kind: 'busy'; label: string; hash?: string }
  | { kind: 'done'; message: string; hash: string }
  | { kind: 'error'; message: string };

export interface TxStep {
  label: string; // e.g. "Approving USDC"
  // Builds the call against a signer-connected contract set. Returns the unsent populated call pieces.
  send: (c: SignerContracts) => { fn: any; args: unknown[]; overrides?: Record<string, unknown> };
}

export interface SignerContracts {
  gswap: Contract;
  at: (address: string, abi: readonly string[]) => Contract;
}

/** Runs one or more admin transactions in order, simulating each before it is sent. */
export function useAdminAction(account: string | null, onDone: () => void) {
  const [status, setStatus] = useState<ActionStatus>({ kind: 'idle' });

  const run = useCallback(
    async (steps: TxStep[], successMessage: string) => {
      const eth = (window as any).ethereum;
      if (!eth || !account || !GSWAP_CONFIG.gswap) return false;
      try {
        const browser = new BrowserProvider(eth);
        const network = await browser.getNetwork();
        if (Number(network.chainId) !== GSWAP_CONFIG.chainId) throw new Error('Your wallet is not on Ethereum mainnet.');
        const signer = await browser.getSigner(account);
        const contracts: SignerContracts = {
          gswap: new Contract(GSWAP_CONFIG.gswap, GSWAP_ADMIN_ABI, signer),
          at: (address, abi) => new Contract(address, abi as any, signer),
        };
        let lastHash = '';
        for (const step of steps) {
          const { fn, args, overrides = {} } = step.send(contracts);
          setStatus({ kind: 'busy', label: `${step.label}: confirm in your wallet` });
          await fn.staticCall(...args, { ...overrides, from: account });
          const tx = await fn(...args, overrides);
          lastHash = tx.hash;
          setStatus({ kind: 'busy', label: `${step.label}: confirming onchain`, hash: tx.hash });
          const rcpt = await tx.wait();
          if (!rcpt || rcpt.status !== 1) throw new Error(`${step.label} failed onchain.`);
        }
        setStatus({ kind: 'done', message: successMessage, hash: lastHash });
        onDone();
        return true;
      } catch (err) {
        console.error('GSwap admin action failed', err);
        setStatus({ kind: 'error', message: describeTxError(err, 'admin') });
        return false;
      }
    },
    [account, onDone]
  );

  const reset = useCallback(() => setStatus({ kind: 'idle' }), []);
  return { status, run, reset, busy: status.kind === 'busy' };
}
