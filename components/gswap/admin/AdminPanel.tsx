'use client';

import { useEffect, useState } from 'react';
import type { JsonRpcProvider } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { GSWAP_CONFIG } from '@/lib/gswap/config';
import { fmtBpsPct, fmtEth, shortAddr } from '@/lib/gswap/format';
import { OwnerControls } from './OwnerControls';
import { PrizeControls } from './PrizeControls';
import { useAdminState } from './useAdmin';

const OPEN_KEY = 'gswap:adminOpen';

/**
 * Owner and prize manager controls. Renders nothing for any other wallet. Hiding it is only a UX choice:
 * every action is enforced by the contract, and each one is simulated before the wallet is asked to sign.
 */
export function AdminPanel({ provider, onChanged }: { provider: JsonRpcProvider | null; onChanged: () => void }) {
  const { account } = useWallet();
  const { admin, refresh, readGswap } = useAdminState(provider, account);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(window.localStorage.getItem(OPEN_KEY) !== '0');
  }, []);

  if (!admin || !account || !provider || !readGswap) return null;

  const toggle = () => {
    setOpen((o) => {
      window.localStorage.setItem(OPEN_KEY, o ? '0' : '1');
      return !o;
    });
  };
  const changed = () => {
    refresh();
    onChanged();
  };
  const role = admin.isOwner ? (admin.isManager ? 'Owner and prize manager' : 'Owner') : 'Prize manager';

  return (
    <section id="admin" className="mx-auto max-w-6xl px-4 py-10 scroll-mt-24">
      <div className="rounded-3xl border border-dashed border-gs-glint/40 bg-gs-ink/60 p-4 sm:p-6">
        <button onClick={toggle} aria-expanded={open} className="w-full flex flex-wrap items-center justify-between gap-3 text-left">
          <span className="flex items-center gap-3">
            <span className="rounded-md bg-gs-glint text-gs-night px-2 py-0.5 text-[11px] font-black tracking-[0.18em]">ADMIN</span>
            <span className="text-lg font-extrabold">GSwap controls</span>
            <span className="hidden sm:inline text-xs text-gs-muted">{role}</span>
          </span>
          <span className="flex items-center gap-3 text-xs text-gs-muted">
            <span className={admin.paused ? 'text-gs-bad font-bold' : ''}>{admin.paused ? 'Paused' : 'Live'}</span>
            <span>Round #{admin.currentRound}</span>
            <span>Fee {fmtBpsPct(admin.feeBps)}</span>
            <span>Pot {fmtEth(admin.pot, 4)} / {fmtEth(admin.potThreshold, 3)}</span>
            <svg viewBox="0 0 20 20" className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="currentColor" aria-hidden="true">
              <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
            </svg>
          </span>
        </button>

        {open && (
          <div className="mt-5 space-y-8">
            <p className="text-xs text-gs-muted">
              Signed in as {shortAddr(account)} ({role.toLowerCase()}). Contract{' '}
              <a href={`${GSWAP_CONFIG.explorer}/address/${GSWAP_CONFIG.gswap}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gacc-cream">
                {shortAddr(GSWAP_CONFIG.gswap!)}
              </a>
              . Only you can see this section.
            </p>

            <div>
              <h3 className="gswap-eyebrow mb-3">Prizes</h3>
              <PrizeControls admin={admin} account={account} provider={provider} onChanged={changed} />
            </div>

            {admin.isOwner && (
              <div>
                <h3 className="gswap-eyebrow mb-3">Owner settings</h3>
                <OwnerControls admin={admin} account={account} provider={provider} readGswap={readGswap} onChanged={changed} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
