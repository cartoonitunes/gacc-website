'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  // When set, the confirm button stays disabled until the user types this value (case-insensitive).
  typeToConfirm?: { value: string; prompt: string };
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, children, confirmLabel, danger, typeToConfirm, onConfirm, onCancel }: Props) {
  const [typed, setTyped] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setTyped('');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  const matches = !typeToConfirm || typed.trim().toLowerCase() === typeToConfirm.value.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="gswap-confirm-title" className="gswap-card w-full max-w-md rounded-3xl p-5 sm:p-6">
        <h3 id="gswap-confirm-title" className={`text-lg font-extrabold ${danger ? 'text-[#f2a796]' : ''}`}>
          {title}
        </h3>
        <div className="mt-3 text-sm text-gs-muted leading-relaxed space-y-2">{children}</div>
        {typeToConfirm && (
          <label className="mt-4 block">
            <span className="text-xs font-bold text-gs-muted">{typeToConfirm.prompt}</span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="mt-1.5 w-full rounded-xl bg-gs-ink/70 ring-1 ring-gs-line focus:ring-gs-ochre/60 !px-3 !py-2.5 text-sm font-mono outline-none"
            />
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-bold ring-1 ring-gs-line hover:ring-gs-ochre/50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches}
            className={`rounded-xl px-4 py-2.5 text-sm font-extrabold disabled:opacity-40 disabled:cursor-not-allowed ${
              danger ? 'bg-gs-bad text-gs-night hover:brightness-110' : 'gswap-btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
