'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWallet } from '@/contexts/WalletContext';
import { shortAddr } from '@/lib/gswap/format';

const LINKS = [
  { href: '#round', label: 'Round' },
  { href: '#winners', label: 'Winners' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '/grandpacoin', label: 'GrandpaCoin' },
];

export function WalletButton() {
  const { account, isConnected, loading, connectWallet, disconnectWallet } = useWallet();
  if (isConnected && account) {
    return (
      <span className="flex items-center gap-2 rounded-full bg-gs-panel ring-1 ring-gs-line pl-3.5 pr-1.5 py-1.5 text-sm font-bold tabular-nums">
        <span className="w-2 h-2 rounded-full bg-gs-good gswap-live-dot" aria-hidden="true" />
        {shortAddr(account)}
        <button
          onClick={disconnectWallet}
          aria-label="Disconnect wallet"
          title="Disconnect"
          className="w-6 h-6 rounded-full flex items-center justify-center text-gs-muted hover:text-gacc-cream hover:bg-gs-raised"
        >
          <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>
      </span>
    );
  }
  return (
    <button onClick={connectWallet} disabled={loading} className="gswap-btn-primary rounded-full px-4 py-2 text-sm whitespace-nowrap">
      {loading ? 'Connecting...' : (
        <>
          Connect<span className="hidden sm:inline"> wallet</span>
        </>
      )}
    </button>
  );
}

export function GSwapNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-40 border-b border-gs-line/70 bg-gs-ink/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="Grandpa Ape Country Club home">
          <Image src="/assets/images/GACC_WHITE.png" alt="GACC" width={120} height={32} className="h-7 w-auto opacity-90" priority />
          <span className="h-5 w-px bg-gs-line" aria-hidden="true" />
          <span className="gswap-title text-lg gswap-gold-text">GSwap</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-semibold text-gs-muted hover:text-gacc-cream transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <WalletButton />
          <button
            className="md:hidden p-2 text-gs-muted hover:text-gacc-cream"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-gs-line/70 px-4 py-3 flex flex-col">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2.5 text-[15px] font-semibold text-gs-muted hover:text-gacc-cream">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
