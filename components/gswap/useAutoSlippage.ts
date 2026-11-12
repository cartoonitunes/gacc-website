'use client';

import { useEffect, useState } from 'react';
import { Contract, type JsonRpcProvider } from 'ethers';
import { GSWAP_CONFIG, QUOTER_V2_ABI } from '@/lib/gswap/config';

// Auto slippage is sized to survive one typical competing trade landing just before the user's swap.
// The quote already includes the user's own price impact, so slippage only has to absorb movement
// caused by others; in a thin pool that is what makes a tight limit revert.
const REFERENCE_TRADE_WEI = 100_000_000_000_000_000n; // 0.1 ETH buy
const PROBE_WEI = 1_000_000_000_000n; // 0.000001 ETH, for the spot rate
const STEP_BPS = 50; // round up to the next 0.5%
const MIN_BPS = 100;
const MAX_BPS = 500;
export const AUTO_SLIPPAGE_FALLBACK_BPS = 200;
const REFRESH_MS = 60_000;

export function autoSlippageFromImpact(impactBps: number): number {
  const stepped = Math.ceil(impactBps / STEP_BPS) * STEP_BPS;
  return Math.min(MAX_BPS, Math.max(MIN_BPS, stepped));
}

/** Suggested slippage in bps from the pool's current depth. Falls back to 2% if the pool cannot be read. */
export function useAutoSlippage(provider: JsonRpcProvider | null): { bps: number; fromPool: boolean } {
  const [state, setState] = useState({ bps: AUTO_SLIPPAGE_FALLBACK_BPS, fromPool: false });

  useEffect(() => {
    if (!provider) return;
    let cancelled = false;
    const quoter = new Contract(GSWAP_CONFIG.quoter, QUOTER_V2_ABI as any, provider);
    const quote = (amountIn: bigint) =>
      quoter.quoteExactInputSingle.staticCall({
        tokenIn: GSWAP_CONFIG.weth,
        tokenOut: GSWAP_CONFIG.token,
        amountIn,
        fee: GSWAP_CONFIG.poolFee,
        sqrtPriceLimitX96: 0n,
      });

    const measure = async () => {
      try {
        const [probe, ref] = await Promise.all([quote(PROBE_WEI), quote(REFERENCE_TRADE_WEI)]);
        const spot = Number(probe[0]) / Number(PROBE_WEI);
        const exec = Number(ref[0]) / Number(REFERENCE_TRADE_WEI);
        const impactBps = Math.max(0, (1 - exec / spot) * 10_000);
        if (!cancelled) setState({ bps: autoSlippageFromImpact(impactBps), fromPool: true });
      } catch {
        /* keep the previous value or the 2% fallback */
      }
    };

    measure();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') measure();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [provider]);

  return state;
}
