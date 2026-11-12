'use client';

import { ReactNode } from 'react';

export function EthIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <span className={`${className} rounded-full bg-[#2c2218] ring-1 ring-gs-line flex items-center justify-center shrink-0`}>
      <svg viewBox="0 0 256 417" className="h-[60%] w-auto" aria-hidden="true">
        <path fill="#f9edcd" d="M127.9 0 125.1 9.5v275.7l2.8 2.8 127.9-75.6z" opacity=".9" />
        <path fill="#d6ab67" d="M127.9 0 0 212.4l127.9 75.6V154.2z" />
        <path fill="#f9edcd" d="M127.9 312.2 126.3 314v98.2l1.6 4.6L256 236.6z" opacity=".9" />
        <path fill="#d6ab67" d="M127.9 416.8V312.2L0 236.6z" />
      </svg>
    </span>
  );
}

export function GrandpaIcon({ className = 'w-6 h-6' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/assets/images/gswap/grandpa-96.jpg" alt="" className={`${className} rounded-full ring-1 ring-gs-line shrink-0`} />;
}

export function TokenPill({ symbol }: { symbol: 'ETH' | 'GRANDPA' }) {
  return (
    <span className="flex items-center gap-2 rounded-full bg-gs-ink/70 ring-1 ring-gs-line pl-1.5 pr-3 py-1.5 shrink-0">
      {symbol === 'ETH' ? <EthIcon className="w-7 h-7" /> : <GrandpaIcon className="w-7 h-7" />}
      <span className="font-extrabold text-sm tracking-wide">{symbol}</span>
    </span>
  );
}

export function Skeleton({ className = 'h-5 w-20' }: { className?: string }) {
  return <span className={`gswap-skeleton inline-block align-middle ${className}`} aria-hidden="true" />;
}

export function Row({ label, value, hint, emphasis }: { label: ReactNode; value: ReactNode; hint?: string; emphasis?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="text-gs-muted text-[13px]" title={hint}>
        {label}
      </dt>
      <dd className={`text-right text-[13px] tabular-nums ${emphasis ? 'font-bold text-gacc-cream' : 'text-gacc-cream/90'}`}>{value}</dd>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, children, id }: { eyebrow: string; title: string; children?: ReactNode; id?: string }) {
  return (
    <div id={id} className="mb-6 md:mb-8 scroll-mt-24">
      <p className="gswap-eyebrow mb-2">{eyebrow}</p>
      <h2 className="gswap-title text-3xl md:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-gs-muted max-w-2xl text-[15px] leading-relaxed">{children}</p>}
    </div>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'bad' | 'good'; children: ReactNode }) {
  const styles = {
    info: 'bg-gs-ochre/10 ring-gs-ochre/30 text-gacc-cream/90',
    warn: 'bg-[#c47f34]/15 ring-[#c47f34]/40 text-[#f3c98b]',
    bad: 'bg-gs-bad/10 ring-gs-bad/40 text-[#f2a796]',
    good: 'bg-gs-good/10 ring-gs-good/40 text-[#c4e3ab]',
  }[tone];
  return <div className={`rounded-xl ring-1 px-3.5 py-2.5 text-[13px] leading-snug ${styles}`}>{children}</div>;
}
