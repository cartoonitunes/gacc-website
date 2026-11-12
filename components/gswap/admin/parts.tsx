'use client';

import { InputHTMLAttributes, ReactNode } from 'react';
import { GSWAP_CONFIG } from '@/lib/gswap/config';
import type { ActionStatus } from './useAdmin';

export function SubCard({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-gs-ink/50 ring-1 ring-gs-line p-4 sm:p-5">
      <h4 className="text-[15px] font-extrabold">{title}</h4>
      {hint && <p className="mt-1 text-xs text-gs-muted leading-relaxed">{hint}</p>}
      <div className="mt-3.5 space-y-3">{children}</div>
    </div>
  );
}

export function Field({
  label,
  suffix,
  error,
  note,
  ...input
}: { label: string; suffix?: ReactNode; error?: string | null; note?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gs-muted">{label}</span>
      <span
        className={`mt-1.5 flex items-center gap-2 rounded-xl bg-gs-ink/70 ring-1 px-3 py-2.5 focus-within:ring-gs-ochre/60 ${
          error ? 'ring-gs-bad/60' : 'ring-gs-line'
        }`}
      >
        <input spellCheck={false} autoComplete="off" {...input} className="min-w-0 flex-1 text-sm font-semibold outline-none" />
        {suffix && <span className="shrink-0 text-xs font-bold text-gs-muted">{suffix}</span>}
      </span>
      {error ? <span className="mt-1 block text-xs text-gs-bad">{error}</span> : note ? <span className="mt-1 block text-xs text-gs-muted">{note}</span> : null}
    </label>
  );
}

export function ActionButton({ children, danger, ...btn }: { danger?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...btn}
      className={`rounded-xl px-4 py-2.5 text-sm font-extrabold whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
        danger ? 'ring-1 ring-gs-bad/60 text-[#f2a796] hover:bg-gs-bad/10' : 'gswap-btn-primary'
      } ${btn.className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function StatusLine({ status, onDismiss }: { status: ActionStatus; onDismiss: () => void }) {
  if (status.kind === 'idle') return null;
  const link = 'hash' in status && status.hash && (
    <a href={`${GSWAP_CONFIG.explorer}/tx/${status.hash}`} target="_blank" rel="noopener noreferrer" className="ml-1 underline underline-offset-2">
      View tx
    </a>
  );
  if (status.kind === 'busy') {
    return (
      <p className="text-xs text-gs-muted" role="status">
        <span className="inline-block w-3 h-3 mr-1.5 align-[-1px] rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />
        {status.label}
        {link}
      </p>
    );
  }
  return (
    <p className={`text-xs ${status.kind === 'done' ? 'text-[#c4e3ab]' : 'text-[#f2a796]'}`} role={status.kind === 'error' ? 'alert' : 'status'}>
      {status.kind === 'done' ? '✓ ' : ''}
      {status.message}
      {link}
      <button onClick={onDismiss} className="ml-2 text-gs-muted hover:text-gacc-cream">
        Dismiss
      </button>
    </p>
  );
}
