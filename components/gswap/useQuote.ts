'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Contract, JsonRpcProvider, parseUnits } from 'ethers';
import { GSWAP_CONFIG, QUOTER_V2_ABI } from '@/lib/gswap/config';
import { buyInput, buyQuote, sellQuote, type BuyQuote, type SellQuote } from '@/lib/gswap/math';

const POOL_ABI = ['function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)'];
const Q96 = 2 ** 96;
// Re-quote an open amount on this interval so a quote left on screen never goes stale.
const REQUOTE_MS = 15_000;

export type Direction = 'buy' | 'sell';

export type Quote =
  | ({ direction: 'buy'; priceImpactPct: number | null } & BuyQuote)
  | ({ direction: 'sell'; priceImpactPct: number | null } & SellQuote);

interface Params {
  provider: JsonRpcProvider | null;
  direction: Direction;
  amountText: string;
  feeBps: bigint;
  taxBps: bigint;
  slippageBps: number;
}

/** Pool output is quoted onchain; fee, tax and slippage are applied locally so they update instantly. */
export function useQuote({ provider, direction, amountText, feeBps, taxBps, slippageBps }: Params) {
  const [raw, setRaw] = useState<{ key: string; poolOut: bigint; spotWethPerGrandpa: number | null } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const [tick, setTick] = useState(0);

  const amountIn = useMemo(() => {
    try {
      return amountText && Number(amountText) > 0 ? parseUnits(amountText, 18) : 0n;
    } catch {
      return 0n;
    }
  }, [amountText]);

  // The pool only ever sees the post-fee ETH on a buy, so that is what gets quoted.
  const quoteIn = direction === 'buy' ? buyInput(amountIn, feeBps).forwarded : amountIn;
  const key = `${direction}:${quoteIn}`;

  useEffect(() => {
    if (quoteIn <= 0n) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') setTick((n) => n + 1);
    }, REQUOTE_MS);
    return () => clearInterval(t);
  }, [quoteIn]);

  useEffect(() => {
    if (!provider || quoteIn <= 0n) {
      setRaw(null);
      setError(null);
      setQuoting(false);
      return;
    }
    const id = ++seq.current;
    // Show the loading state only for a new amount, not for a background re-quote of the same one.
    setRaw((prev) => (prev && prev.key === key ? prev : null));
    if (!raw || raw.key !== key) setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const quoter = new Contract(GSWAP_CONFIG.quoter, QUOTER_V2_ABI as any, provider);
        const pool = new Contract(GSWAP_CONFIG.pool, POOL_ABI, provider);
        const [res, slot0] = await Promise.all([
          quoter.quoteExactInputSingle.staticCall({
            tokenIn: direction === 'buy' ? GSWAP_CONFIG.weth : GSWAP_CONFIG.token,
            tokenOut: direction === 'buy' ? GSWAP_CONFIG.token : GSWAP_CONFIG.weth,
            amountIn: quoteIn,
            fee: GSWAP_CONFIG.poolFee,
            sqrtPriceLimitX96: 0n,
          }),
          pool.slot0().catch(() => null),
        ]);
        if (id !== seq.current) return;
        // token0 = GRANDPA, token1 = WETH, both 18 decimals: price(token1 per token0) = (sqrtP / 2^96)^2.
        const s = slot0 ? Number(slot0[0]) / Q96 : null;
        setRaw({ key, poolOut: res[0] as bigint, spotWethPerGrandpa: s ? s * s : null });
        setError(null);
      } catch (err: any) {
        if (id !== seq.current) return;
        console.warn('Quote failed', err?.shortMessage || err);
        setRaw(null);
        setError('Could not get a quote. The amount may exceed pool liquidity, or the network is busy.');
      } finally {
        if (id === seq.current) setQuoting(false);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, direction, quoteIn, key, tick]);

  const quote: Quote | null = useMemo(() => {
    if (!raw || raw.key !== key || amountIn <= 0n) return null;
    const lpFactor = 1 - GSWAP_CONFIG.poolFee / 1_000_000;
    const spot = raw.spotWethPerGrandpa;
    if (direction === 'buy') {
      const q = buyQuote(amountIn, feeBps, raw.poolOut, taxBps, slippageBps);
      // Execution vs spot, excluding the LP fee, on the amount that actually reached the pool.
      const exec = Number(q.poolOut) / (Number(q.forwarded) * lpFactor);
      const impact = spot ? Math.max(0, (1 - exec * spot) * 100) : null;
      return { direction, priceImpactPct: impact, ...q };
    }
    const q = sellQuote(amountIn, raw.poolOut, feeBps, slippageBps);
    const exec = Number(q.grossOut) / (Number(amountIn) * lpFactor);
    const impact = spot ? Math.max(0, (1 - exec / spot) * 100) : null;
    return { direction, priceImpactPct: impact, ...q };
  }, [raw, key, amountIn, direction, feeBps, taxBps, slippageBps]);

  return { amountIn, quote, quoting: quoting || (amountIn > 0n && !quote && !error), error };
}
