// Pure helpers that mirror GSwap.sol so the UI previews exactly what the contract will do.

export const BPS = 10_000n;

// Mirrors GSwap constants (HOLDER_BONUS_FLOOR, HOLDER_BONUS_COEFF, MAX_HOLDER_MULTIPLIER_BPS).
export const HOLDER_BONUS_FLOOR = 10_000n * 10n ** 18n;
const HOLDER_BONUS_COEFF = 100n;
export const MAX_HOLDER_MULTIPLIER_BPS = 20_000n;

/** Integer square root, identical to GSwap._sqrt (Babylonian, floor). */
export function sqrtBig(x: bigint): bigint {
  if (x <= 0n) return 0n;
  let z = (x + 1n) / 2n;
  let y = x;
  while (z < y) {
    y = z;
    z = (x / z + z) / 2n;
  }
  return y;
}

export function applyBps(amount: bigint, bps: bigint): bigint {
  return (amount * bps) / BPS;
}

export function minusSlippage(amount: bigint, slippageBps: number): bigint {
  return (amount * (BPS - BigInt(slippageBps))) / BPS;
}

function bitLength(x: bigint): bigint {
  let n = 0n;
  while (x > 0n) {
    n++;
    x >>= 1n;
  }
  return n;
}

/** Holder multiplier in bps for a GRANDPA balance, identical to GSwap._holderMultiplierBps. */
export function holderMultiplierBps(balance: bigint): bigint {
  const bits = bitLength(balance / HOLDER_BONUS_FLOOR);
  const m = BPS + bits * bits * HOLDER_BONUS_COEFF;
  return m > MAX_HOLDER_MULTIPLIER_BPS ? MAX_HOLDER_MULTIPLIER_BPS : m;
}

/** Smallest balance that reaches the next multiplier step, or null once the 2x cap is reached. */
export function nextMultiplierStep(balance: bigint): { balance: bigint; bps: bigint } | null {
  if (holderMultiplierBps(balance) >= MAX_HOLDER_MULTIPLIER_BPS) return null;
  const bits = bitLength(balance / HOLDER_BONUS_FLOOR);
  const next = HOLDER_BONUS_FLOOR * (1n << bits);
  return { balance: next, bps: holderMultiplierBps(next) };
}

/** Entry weight from a user's round volumes: buys count fully, sells half (GSwap._entryWeight). */
export function entryWeight(buyVolume: bigint, sellVolume: bigint): bigint {
  return sqrtBig(buyVolume) + sqrtBig(sellVolume) / 2n;
}

/** Weight a swap adds, given the user's current round volumes and the swap's gross ETH side. */
export function entryWeightGain(buyVolume: bigint, sellVolume: bigint, ethSide: bigint, isBuy: boolean): bigint {
  const before = entryWeight(buyVolume, sellVolume);
  const after = isBuy ? entryWeight(buyVolume + ethSide, sellVolume) : entryWeight(buyVolume, sellVolume + ethSide);
  return after - before;
}

// Tickets are a display scale over the contract's sqrt(wei) weights: sqrt(ETH volume) x 16, the same
// convention as the Unicorn Meat Cauldron, so 1 ETH bought = 16 tickets and 0.05 ETH = about 3.6.
// Odds are always computed from the raw weights, never from rounded tickets.
export const TICKETS_PER_SQRT_ETH = 16;

export function weightToTickets(weight: bigint): number {
  return (Number(weight) / 1e9) * TICKETS_PER_SQRT_ETH;
}

export interface BuyBreakdown {
  amountIn: bigint;
  fee: bigint; // GSwap fee, taken from the ETH input before routing
  forwarded: bigint; // ETH that reaches the pool
}

/** GSwap takes its fee from the ETH input, then routes the remainder (GSwap.swap buy branch). */
export function buyInput(amountIn: bigint, feeBps: bigint): BuyBreakdown {
  const fee = applyBps(amountIn, feeBps);
  return { amountIn, fee, forwarded: amountIn - fee };
}

export interface BuyQuote extends BuyBreakdown {
  poolOut: bigint; // pre-tax GRANDPA leaving the pool
  tax: bigint; // GRANDPA buy tax
  received: bigint; // what lands in the wallet
  minReceived: bigint; // amountOutMinimum, checked by GSwap against the post-tax balance delta
}

export function buyQuote(amountIn: bigint, feeBps: bigint, poolOut: bigint, taxBps: bigint, slippageBps: number): BuyQuote {
  const tax = applyBps(poolOut, taxBps);
  const received = poolOut - tax;
  return { ...buyInput(amountIn, feeBps), poolOut, tax, received, minReceived: minusSlippage(received, slippageBps) };
}

export interface SellQuote {
  amountIn: bigint;
  grossOut: bigint; // ETH from the pool
  fee: bigint; // GSwap fee, taken from the ETH output
  received: bigint;
  minGrossOut: bigint; // amountOutMinimum, enforced by the V3 router on the gross output
  minReceived: bigint; // worst case after the fee
}

export function sellQuote(amountIn: bigint, grossOut: bigint, feeBps: bigint, slippageBps: number): SellQuote {
  const fee = applyBps(grossOut, feeBps);
  const minGrossOut = minusSlippage(grossOut, slippageBps);
  return {
    amountIn,
    grossOut,
    fee,
    received: grossOut - fee,
    minGrossOut,
    minReceived: minGrossOut - applyBps(minGrossOut, feeBps),
  };
}

/** Accepts "1", "1.", ".5", "0.25"; rejects anything else. Truncates past `decimals`. */
export function sanitizeAmountInput(raw: string, decimals: number): string | null {
  const v = raw.replace(/,/g, '.').trim();
  if (v === '') return '';
  if (!/^\d*\.?\d*$/.test(v)) return null;
  const [whole, frac] = v.split('.');
  return frac !== undefined && frac.length > decimals ? `${whole}.${frac.slice(0, decimals)}` : v;
}
