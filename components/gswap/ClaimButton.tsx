'use client';

import { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { GSWAP_ABI } from '@/lib/gswap/abi';
import { GSWAP_CONFIG } from '@/lib/gswap/config';
import { describeTxError } from '@/lib/gswap/errors';

/** Lets a winner collect prize legs that could not be auto-paid at the draw (GSwap.claim). */
export function ClaimButton({ roundId, account, onDone }: { roundId: number; account: string; onDone: () => void }) {
  const [state, setState] = useState<{ kind: 'idle' | 'busy' | 'error'; message?: string }>({ kind: 'idle' });

  const claim = async () => {
    const eth = (window as any).ethereum;
    if (!eth || !GSWAP_CONFIG.gswap) return;
    setState({ kind: 'busy' });
    try {
      const browser = new BrowserProvider(eth);
      const signer = await browser.getSigner(account);
      const gswap = new Contract(GSWAP_CONFIG.gswap, GSWAP_ABI as any, signer);
      await gswap.claim.staticCall(roundId, { from: account });
      const tx = await gswap.claim(roundId);
      const rcpt = await tx.wait();
      if (!rcpt || rcpt.status !== 1) throw new Error('The claim transaction failed onchain.');
      setState({ kind: 'idle' });
      onDone();
    } catch (err) {
      console.error('GSwap claim failed', err);
      setState({ kind: 'error', message: describeTxError(err, 'claim') });
    }
  };

  return (
    <span className="flex flex-col items-end gap-1">
      <button onClick={claim} disabled={state.kind === 'busy'} className="gswap-btn-primary rounded-full px-3.5 py-1.5 text-xs whitespace-nowrap">
        {state.kind === 'busy' ? 'Claiming...' : 'Claim prize'}
      </button>
      {state.kind === 'error' && <span className="text-[11px] text-[#f2a796] max-w-[260px] text-right">{state.message}</span>}
    </span>
  );
}
