'use client';

import { fmtMultiplier, fmtTickets } from '@/lib/gswap/format';

interface Props {
  tickets: number;
  isBuy: boolean;
  multiplierBps: bigint;
  // Estimated chance of winning the round after this swap (percent), when the round can be read.
  oddsPct: number | null;
  // What the round pays out, e.g. "0.0225 ETH + 3 NFTs".
  prizeLabel: string | null;
  live: boolean;
}

function fmtOdds(pct: number): string {
  if (pct >= 99.95) return '100%';
  if (pct >= 10) return `${pct.toFixed(0)}%`;
  if (pct >= 0.1) return `${pct.toFixed(1)}%`;
  return '<0.1%';
}

/** The reward for a swap, shown as the centerpiece of the swap card: tickets earned and what they are a shot at. */
export function TicketReward({ tickets, isBuy, multiplierBps, oddsPct, prizeLabel, live }: Props) {
  const shown = fmtTickets(tickets);
  const boosted = multiplierBps > 10_000n;

  if (tickets <= 0) {
    return (
      <div className="mt-3 rounded-2xl ring-1 ring-gs-line bg-gs-ink/40 px-4 py-3 text-sm text-gs-muted">
        🎟️ This swap is too small to earn a ticket. Try a slightly bigger amount.
      </div>
    );
  }

  return (
    <div className="gswap-ticket-reward mt-3 relative overflow-hidden rounded-2xl ring-1 ring-gs-glint/50 px-4 py-4 sm:px-5" aria-live="polite">
      <div className="relative flex items-center gap-4">
        <div className="gswap-ticket-stub shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-3xl sm:text-4xl" aria-hidden="true">
          🎟️
        </div>
        <div className="min-w-0 flex-1">
          <p className="gswap-eyebrow !text-[10px]">{live ? "You'll earn" : 'At launch this earns'}</p>
          <p className="flex items-baseline gap-2 leading-none">
            {/* Re-keyed on the value so the pop replays whenever the count changes. */}
            <span key={shown} className="gswap-pop gswap-title gswap-gold-text text-5xl sm:text-6xl tabular-nums pr-1">
              +{shown}
            </span>
            <span className="text-lg sm:text-xl font-extrabold italic">ticket{shown === '1' ? '' : 's'}</span>
          </p>
          <p className="mt-1.5 text-xs text-gs-muted">{isBuy ? 'Buys earn full tickets' : 'Sells earn half tickets'}</p>
        </div>
      </div>

      {(boosted || (oddsPct !== null && prizeLabel)) && (
        <div className="relative mt-3 flex flex-wrap gap-2">
          {boosted && (
            <span className="rounded-full bg-gs-ink/70 ring-1 ring-gs-glint/40 px-2.5 py-1 text-xs font-extrabold text-gs-glint">
              ⚡ {fmtMultiplier(multiplierBps)} holder boost
            </span>
          )}
          {oddsPct !== null && prizeLabel && (
            <span className="rounded-full bg-gs-ink/70 ring-1 ring-gs-line px-2.5 py-1 text-xs font-bold">
              🏆 ≈{fmtOdds(oddsPct)} shot at <span className="text-gs-glint">{prizeLabel}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
