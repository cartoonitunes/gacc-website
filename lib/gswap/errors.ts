import { Interface } from 'ethers';
import { GSWAP_ABI } from './abi';

const iface = new Interface(GSWAP_ABI as any);

const SLIPPAGE_MESSAGE =
  'The price moved past your slippage limit. Your quote already accounts for the 6% buy tax, so a small increase in slippage is usually enough.';

const REVERT_MESSAGES: Record<string, string> = {
  InsufficientOutput: SLIPPAGE_MESSAGE,
  IsPaused: 'GSwap is paused right now. Swaps will reopen once it is unpaused.',
  UnsupportedPair: 'GSwap only routes ETH and GRANDPA.',
  InvalidParams: 'That swap amount is not valid. Enter an amount greater than zero.',
  ETHTransferFailed: 'GSwap could not send ETH to your wallet. If you are using a smart contract wallet, try a regular wallet.',
  SafeERC20FailedOperation: 'The GRANDPA transfer failed. Check your balance and approval, then try again.',
  ReentrancyGuardReentrantCall: 'The transaction was blocked by a reentrancy guard. Please try again.',
  NotWinner: 'Only the winner of this round can claim its prize.',
  RoundAlreadySettled: 'This prize has already been delivered.',
  NothingToClaim: 'There is nothing left to claim for this round.',
  RoundNotDrawn: 'This round has not been drawn yet.',
};

// Uniswap V3 router reverts with string reasons.
const REASON_MESSAGES: [RegExp, string][] = [
  [/too little received/i, SLIPPAGE_MESSAGE],
  [/transaction too old/i, 'The swap deadline passed before it was mined. Please try again.'],
  [/STF|transfer_from_failed/i, 'The GRANDPA transfer failed. Check your balance and approval.'],
];

function findRevertData(err: any): string | null {
  const candidates = [err?.data, err?.info?.error?.data, err?.error?.data, err?.info?.error?.data?.data];
  for (const c of candidates) {
    if (typeof c === 'string' && c.startsWith('0x') && c.length >= 10) return c;
  }
  return null;
}

export function describeTxError(err: any, context: 'swap' | 'claim' = 'swap'): string {
  if (!err) return 'Something went wrong. Please try again.';

  if (err.code === 'ACTION_REJECTED' || err?.info?.error?.code === 4001 || err?.error?.code === 4001) {
    return 'You rejected the request in your wallet.';
  }
  if (err.code === 'INSUFFICIENT_FUNDS') {
    return 'Not enough ETH to cover this swap plus gas.';
  }

  let name: string | undefined = err.revert?.name;
  if (!name) {
    const data = findRevertData(err);
    if (data) {
      try {
        name = iface.parseError(data)?.name;
      } catch {
        /* not a GSwap error */
      }
    }
  }
  if (name && REVERT_MESSAGES[name]) return REVERT_MESSAGES[name];

  const reason: string = err.reason || err.shortMessage || err.message || '';
  for (const [re, msg] of REASON_MESSAGES) {
    if (re.test(reason)) return msg;
  }

  if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT' || /failed to fetch|network/i.test(reason)) {
    return 'Network trouble reaching Ethereum. Check your connection and try again.';
  }
  if (err.code === 'CALL_EXCEPTION') {
    if (name) return `The transaction would fail onchain (${name}).`;
    return context === 'claim'
      ? 'The claim would fail onchain. This usually means your wallet cannot accept one of the prizes (some smart and delegated wallets reject NFTs). Please contact the GACC team.'
      : 'The swap would fail onchain. Try a smaller amount or a higher slippage.';
  }
  return reason ? reason.slice(0, 180) : 'Something went wrong. Please try again.';
}
