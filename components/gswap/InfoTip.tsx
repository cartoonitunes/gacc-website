'use client';

import { ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

const EDGE_PX = 12;

/** Small "i" button with an explanation. Opens on hover, keyboard focus or tap, so it works on touch screens. */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  // Tracked separately so a click never closes a tip that hover or focus just opened.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || focused || pinned;
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  // Keep the tip inside the viewport on narrow screens by nudging it sideways after it renders.
  useLayoutEffect(() => {
    if (!open || !tipRef.current) {
      setShift(0);
      return;
    }
    const r = tipRef.current.getBoundingClientRect();
    const left = r.left - shift;
    const right = r.right - shift;
    let next = 0;
    if (right > window.innerWidth - EDGE_PX) next = window.innerWidth - EDGE_PX - right;
    if (left + next < EDGE_PX) next = EDGE_PX - left;
    if (next !== shift) setShift(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) {
        setPinned(false);
        setHovered(false);
        setFocused(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex normal-case tracking-normal" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setPinned(true)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setPinned(false);
        }}
        className="w-4 h-4 rounded-full ring-1 ring-gs-muted/60 text-gs-muted hover:text-gs-glint hover:ring-gs-glint inline-flex items-center justify-center text-[10px] font-black italic leading-none"
      >
        i
      </button>
      {open && (
        <span
          ref={tipRef}
          id={id}
          style={{ transform: `translateX(${shift}px)` }}
          role="tooltip"
          className="absolute -left-3 top-full z-30 mt-2 w-64 max-w-[calc(100vw-3rem)] rounded-xl bg-gs-raised ring-1 ring-gs-glint/40 px-3 py-2.5 text-xs font-medium leading-relaxed text-gacc-cream shadow-2xl"
        >
          {children}
        </span>
      )}
    </span>
  );
}
