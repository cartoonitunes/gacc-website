'use client';

import { GSWAP_CONFIG } from '@/lib/gswap/config';
import { fmtEth, fmtToken } from '@/lib/gswap/format';
import type { TxPhase } from './useSwapTx';

function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={`${GSWAP_CONFIG.explorer}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-bold text-gs-glint underline underline-offset-2 hover:text-gacc-cream"
    >
      View on Etherscan
    </a>
  );
}

export function TxStatus({ phase, onDismiss }: { phase: TxPhase; onDismiss: () => void }) {
  if (phase.kind === 'idle') return null;

  if (phase.kind === 'wallet' || phase.kind === 'pending') {
    const steps = phase.step === 'approve' ? ['Approve GRANDPA', 'Swap'] : ['Swap'];
    return (
      <div className="mt-3 rounded-2xl bg-gs-ink/60 ring-1 ring-gs-line p-4 text-sm" role="status" aria-live="polite">
        <ol className="space-y-2">
          {steps.map((s, i) => {
            const active = i === 0;
            return (
              <li key={s} className={`flex items-center gap-2.5 ${active ? '' : 'text-gs-muted'}`}>
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                    active ? 'ring-2 ring-gs-glint text-gs-glint' : 'ring-1 ring-gs-line'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="font-bold">{s}</span>
                {active && (
                  <span className="ml-auto text-xs text-gs-muted">
                    {phase.kind === 'wallet' ? 'Waiting for your wallet' : 'Confirming onchain'}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {phase.kind === 'pending' && (
          <p className="mt-3 text-xs">
            Submitted. <TxLink hash={phase.hash} />
          </p>
        )}
      </div>
    );
  }

  if (phase.kind === 'error') {
    return (
      <div className="mt-3 rounded-2xl bg-gs-bad/10 ring-1 ring-gs-bad/40 p-4 text-sm" role="alert">
        <div className="flex items-start justify-between gap-3">
          <p className="font-extrabold text-[#f2a796]">Swap not completed</p>
          <button onClick={onDismiss} className="text-xs text-gs-muted hover:text-gacc-cream" aria-label="Dismiss">
            Dismiss
          </button>
        </div>
        <p className="mt-1 text-[#f2c4b8] leading-snug">{phase.message}</p>
        {phase.hash && (
          <p className="mt-2 text-xs">
            <TxLink hash={phase.hash} />
          </p>
        )}
      </div>
    );
  }

  const { result } = phase;
  return (
    <div className="mt-3 rounded-2xl bg-gs-good/10 ring-1 ring-gs-good/40 p-4 text-sm" role="status" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <p className="font-extrabold text-[#c4e3ab]">Swap confirmed</p>
        <button onClick={onDismiss} className="text-xs text-gs-muted hover:text-gacc-cream" aria-label="Dismiss">
          Dismiss
        </button>
      </div>
      {result.received !== null && (
        <p className="mt-1">
          You received{' '}
          <span className="font-extrabold">
            {result.direction === 'buy' ? `${fmtToken(result.received)} GRANDPA` : fmtEth(result.received, 6)}
          </span>
          {result.fee !== null && <span className="text-gs-muted"> and added {fmtEth(result.fee, 6)} to the pot.</span>}
        </p>
      )}
      {result.wonPrize !== null && (
        <p className="mt-2 rounded-xl bg-gs-glint/15 ring-1 ring-gs-glint/50 px-3 py-2 font-extrabold text-gs-glint">
          🏆 Your swap drew round #{result.drawnRound} and you won {fmtEth(result.wonPrize, 4)}!
        </p>
      )}
      {result.wonPrize === null && result.drawnRound !== null && (
        <p className="mt-2 text-gs-muted">Your swap filled the pot and drew round #{result.drawnRound}. A new round has started.</p>
      )}
      <p className="mt-2 text-xs">
        <TxLink hash={phase.hash} />
      </p>
    </div>
  );
}
