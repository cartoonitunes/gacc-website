import { formatUnits } from 'ethers';

/** Human formatting for 18-decimal amounts: more precision for small values, compact for large ones. */
export function fmtToken(value: bigint | null | undefined, opts: { decimals?: number; max?: number; compact?: boolean } = {}): string {
  if (value === null || value === undefined) return '-';
  const n = Number(formatUnits(value, opts.decimals ?? 18));
  if (n === 0) return '0';
  if (opts.compact && Math.abs(n) >= 100_000) {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
  }
  const abs = Math.abs(n);
  const max = opts.max ?? (abs >= 1000 ? 0 : abs >= 1 ? 4 : abs >= 0.0001 ? 6 : 8);
  if (abs > 0 && abs < 10 ** -max) return `<${(10 ** -max).toFixed(max)}`;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: max }).format(n);
}

export function fmtEth(value: bigint | null | undefined, max = 4): string {
  return value === null || value === undefined ? '-' : `${fmtToken(value, { max })} ETH`;
}

export function fmtBpsPct(bps: bigint | number, digits = 2): string {
  const pct = Number(bps) / 100;
  return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(digits)}%`;
}

export function fmtMultiplier(bps: bigint | number): string {
  return `${(Number(bps) / 10_000).toFixed(2)}x`;
}

export function fmtEntries(n: number): string {
  if (n === 0) return '0';
  if (n < 0.001) return '<0.001';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: n >= 100 ? 1 : 3 }).format(n);
}

export function shortAddr(a: string): string {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}
