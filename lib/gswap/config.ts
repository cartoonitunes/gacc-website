import { getAddress, ZeroAddress } from 'ethers';

function parseAddress(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const addr = getAddress(value.trim());
    return addr === ZeroAddress ? null : addr;
  } catch {
    return null;
  }
}

// Every address below was verified onchain with `cast code` / `cast call` (Nov 2026).
export const GSWAP_CONFIG = {
  chainId: 1,
  explorer: 'https://etherscan.io',

  // Set NEXT_PUBLIC_GSWAP_ADDRESS once GSwap is deployed. Until then the page runs in preview mode:
  // live Uniswap quotes, but no raffle reads and no swaps.
  gswap: parseAddress(process.env.NEXT_PUBLIC_GSWAP_ADDRESS),
  // Optional: the GSwap deployment block, so admin log scans (prize manager history) start there.
  deployBlock: Number(process.env.NEXT_PUBLIC_GSWAP_DEPLOY_BLOCK) || 0,

  // GrandpaCoin: symbol GRANDPA, 18 decimals, BUY_TAX_BPS() = 600, taxEnabled() = true.
  token: '0x20BFd82E6AD6A39cf4bD1F803e662FC065cD3d5F',
  tokenSymbol: 'GRANDPA',
  tokenDecimals: 18,
  // WETH9 (token1 of the pool).
  weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  // GRANDPA/WETH Uniswap V3 pool, 1% tier: fee() = 10000, token0 = GRANDPA, token1 = WETH.
  pool: '0xc2F9673849eA38fAe55C29E18E797f36b18A3078',
  poolFee: 10_000,
  // Uniswap V3 QuoterV2 (mainnet). Used for quotes, independent of GSwap.
  quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',

  // Used only if the onchain BUY_TAX_BPS() / taxEnabled() reads fail.
  fallbackBuyTaxBps: 600n,
  // Preview-mode fee until feeBps() can be read. Matches DEFAULT_FEE_BPS in um-raffle's DeployGSwap.s.sol
  // (the contract itself defaults to 30 bps, but the deploy script sets 50).
  fallbackFeeBps: 50n,

  // Default slippage is Auto (components/gswap/useAutoSlippage.ts), sized from current pool depth.
  minSlippageBps: 10,
  maxSlippageBps: 5_000,
  highSlippageWarnBps: 500,

  // ETH kept back from "Max" on buys so the user can still pay gas.
  gasReserveWei: 3_000_000_000_000_000n, // 0.003 ETH
  txDeadlineSeconds: 600,

  // Rounds fetched for past winners and the user's win count.
  historyLimit: 100,
  historyDisplay: 12,
  pollMs: 20_000,
} as const;

export const isGSwapLive = GSWAP_CONFIG.gswap !== null;

export const GRANDPA_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function BUY_TAX_BPS() view returns (uint256)',
  'function taxEnabled() view returns (bool)',
] as const;

export const QUOTER_V2_ABI = [
  'function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
] as const;
