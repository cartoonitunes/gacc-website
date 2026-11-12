'use client';

import { useCallback, useState } from 'react';
import { BrowserProvider, Contract, Interface, TransactionReceipt, id as topicId, zeroPadValue } from 'ethers';
import { GSWAP_ABI } from '@/lib/gswap/abi';
import { GSWAP_CONFIG, GRANDPA_TOKEN_ABI } from '@/lib/gswap/config';
import { describeTxError } from '@/lib/gswap/errors';
import type { Quote } from './useQuote';

export type TxPhase =
  | { kind: 'idle' }
  | { kind: 'wallet'; step: 'approve' | 'swap' }
  | { kind: 'pending'; step: 'approve' | 'swap'; hash: string }
  | { kind: 'success'; hash: string; result: SwapResult }
  | { kind: 'error'; message: string; hash?: string };

export interface SwapResult {
  direction: 'buy' | 'sell';
  received: bigint | null; // GRANDPA (buy) or net ETH (sell)
  fee: bigint | null;
  drawnRound: number | null; // this swap filled the pot and triggered a draw
  wonPrize: bigint | null; // the connected wallet won that draw
}

const gswapIface = new Interface(GSWAP_ABI as any);
const TRANSFER_TOPIC = topicId('Transfer(address,address,uint256)');

function parseReceipt(rcpt: TransactionReceipt, account: string, direction: 'buy' | 'sell'): SwapResult {
  const me = account.toLowerCase();
  const gswapAddr = GSWAP_CONFIG.gswap!.toLowerCase();
  const res: SwapResult = { direction, received: null, fee: null, drawnRound: null, wonPrize: null };
  let ethVolume: bigint | null = null;
  let tokenIn = 0n;

  for (const log of rcpt.logs) {
    const addr = log.address.toLowerCase();
    if (addr === GSWAP_CONFIG.token.toLowerCase() && log.topics[0] === TRANSFER_TOPIC) {
      // GRANDPA transfers to the user on a buy (the post-tax amount; the tax goes to the vault).
      if (log.topics[2] === zeroPadValue(account, 32).toLowerCase()) tokenIn += BigInt(log.data);
      continue;
    }
    if (addr !== gswapAddr) continue;
    let parsed;
    try {
      parsed = gswapIface.parseLog(log);
    } catch {
      continue;
    }
    if (!parsed) continue;
    if (parsed.name === 'FeeCollected' && parsed.args.swapper.toLowerCase() === me) res.fee = parsed.args.feeAmount;
    if (parsed.name === 'EntryRegistered' && parsed.args.swapper.toLowerCase() === me) ethVolume = parsed.args.ethVolume;
    if (parsed.name === 'WinnerDrawn') {
      res.drawnRound = Number(parsed.args.roundId);
    }
    if (parsed.name === 'PrizeAutoPaid' && parsed.args.winner.toLowerCase() === me) res.wonPrize = parsed.args.ethAmount;
  }

  if (direction === 'buy') res.received = tokenIn > 0n ? tokenIn : null;
  // On a sell the entry volume is the gross ETH out; the user receives gross minus the fee.
  else if (ethVolume !== null && res.fee !== null) res.received = ethVolume - res.fee;
  return res;
}

export function useSwapTx(onSettled: () => void) {
  const [phase, setPhase] = useState<TxPhase>({ kind: 'idle' });

  const reset = useCallback(() => setPhase({ kind: 'idle' }), []);

  const execute = useCallback(
    async ({ account, quote, allowance }: { account: string; quote: Quote; allowance: bigint }) => {
      const eth = (window as any).ethereum;
      if (!eth || !GSWAP_CONFIG.gswap) return;
      const browser = new BrowserProvider(eth);
      let hash: string | undefined;

      try {
        const network = await browser.getNetwork();
        if (Number(network.chainId) !== GSWAP_CONFIG.chainId) {
          setPhase({ kind: 'error', message: 'Your wallet is not on Ethereum mainnet. Switch networks and try again.' });
          return;
        }
        // Fresh signer for the current account: the shared wallet context can hold a stale one after an account switch.
        const signer = await browser.getSigner(account);
        const gswap = new Contract(GSWAP_CONFIG.gswap, GSWAP_ABI as any, signer);

        if (quote.direction === 'sell' && allowance < quote.amountIn) {
          // Approve exactly this sell, not an unlimited allowance.
          const token = new Contract(GSWAP_CONFIG.token, GRANDPA_TOKEN_ABI as any, signer);
          setPhase({ kind: 'wallet', step: 'approve' });
          const approveTx = await token.approve(GSWAP_CONFIG.gswap, quote.amountIn);
          hash = approveTx.hash;
          setPhase({ kind: 'pending', step: 'approve', hash: approveTx.hash });
          const approveRcpt = await approveTx.wait();
          if (!approveRcpt || approveRcpt.status !== 1) throw new Error('The GRANDPA approval failed onchain.');
          hash = undefined;
        }

        const block = await browser.getBlock('latest');
        const deadline = BigInt((block?.timestamp ?? Math.floor(Date.now() / 1000)) + GSWAP_CONFIG.txDeadlineSeconds);
        const isBuy = quote.direction === 'buy';
        const params = {
          tokenIn: isBuy ? GSWAP_CONFIG.weth : GSWAP_CONFIG.token,
          tokenOut: isBuy ? GSWAP_CONFIG.token : GSWAP_CONFIG.weth,
          fee: GSWAP_CONFIG.poolFee,
          recipient: account,
          deadline,
          amountIn: quote.amountIn,
          // Buy: GSwap checks this against the post-tax GRANDPA that lands in the wallet.
          // Sell: the V3 router checks it against the gross ETH before GSwap's fee.
          amountOutMinimum: isBuy ? quote.minReceived : quote.minGrossOut,
          sqrtPriceLimitX96: 0n,
        };
        const overrides = isBuy ? { value: quote.amountIn } : {};

        // Simulate first so a revert surfaces as a clear message instead of a failed transaction.
        await gswap.swap.staticCall(params, { ...overrides, from: account });

        setPhase({ kind: 'wallet', step: 'swap' });
        const tx = await gswap.swap(params, overrides);
        hash = tx.hash;
        setPhase({ kind: 'pending', step: 'swap', hash: tx.hash });
        const rcpt: TransactionReceipt | null = await tx.wait();
        if (!rcpt || rcpt.status !== 1) throw new Error('The swap transaction failed onchain.');
        setPhase({ kind: 'success', hash: tx.hash, result: parseReceipt(rcpt, account, quote.direction) });
      } catch (err: any) {
        console.error('GSwap swap failed', err);
        setPhase({ kind: 'error', message: describeTxError(err), hash });
      } finally {
        onSettled();
      }
    },
    [onSettled]
  );

  return { phase, execute, reset };
}
