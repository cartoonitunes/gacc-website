'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatEther, parseEther, type Contract, type JsonRpcProvider } from 'ethers';
import { GSWAP_CONFIG } from '@/lib/gswap/config';
import { loadKnownManagers, parseAddressInput, saveKnownManagers } from '@/lib/gswap/admin';
import { fmtBpsPct, fmtEth, shortAddr } from '@/lib/gswap/format';
import { sanitizeAmountInput } from '@/lib/gswap/math';
import { Notice } from '../ui';
import { ConfirmDialog } from './ConfirmDialog';
import { ActionButton, Field, StatusLine, SubCard } from './parts';
import { useAdminAction, type AdminState } from './useAdmin';

interface Props {
  admin: AdminState;
  account: string;
  provider: JsonRpcProvider;
  readGswap: Contract;
  onChanged: () => void;
}

// ---------------------------------------------------------------------------

function FeeControl({ admin, account, onChanged }: Props) {
  const { status, run, reset, busy } = useAdminAction(account, onChanged);
  const [bps, setBps] = useState(Number(admin.pendingFeeBps));
  const [text, setText] = useState((Number(admin.pendingFeeBps) / 100).toString());
  useEffect(() => {
    setBps(Number(admin.pendingFeeBps));
    setText((Number(admin.pendingFeeBps) / 100).toString());
  }, [admin.pendingFeeBps]);

  const max = Number(admin.maxFeeBps);
  const queued = admin.pendingFeeBps !== admin.feeBps;
  const willQueue = admin.participants > 0;

  return (
    <SubCard
      title="Swap fee"
      hint={
        <>
          Current fee {fmtBpsPct(admin.feeBps)} of the ETH side
          {queued && <>, changing to {fmtBpsPct(admin.pendingFeeBps)} after this round draws</>}.
        </>
      }
    >
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={max}
          step={5}
          value={bps}
          aria-label="Fee in basis points"
          onChange={(e) => {
            setBps(Number(e.target.value));
            setText((Number(e.target.value) / 100).toString());
          }}
          className="flex-1 accent-[#d6ab67]"
        />
        <span className="w-24">
          <Field
            label=""
            aria-label="Fee percent"
            inputMode="decimal"
            value={text}
            suffix="%"
            onChange={(e) => {
              const v = sanitizeAmountInput(e.target.value, 2);
              if (v === null) return;
              setText(v);
              const n = Math.round(Number(v) * 100);
              if (v !== '' && n >= 0 && n <= max) setBps(n);
            }}
          />
        </span>
      </div>
      {Number(text) * 100 > max && <p className="text-xs text-gs-bad">The maximum is {fmtBpsPct(max)}.</p>}
      {willQueue && bps !== Number(admin.feeBps) && (
        <Notice tone="info">This round already has {admin.participants} player{admin.participants === 1 ? '' : 's'}, so the new fee takes effect after it draws.</Notice>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <ActionButton
          disabled={busy || bps === Number(admin.pendingFeeBps) || Number(text) * 100 > max}
          onClick={() => run([{ label: 'Setting fee', send: (c) => ({ fn: c.gswap.setFeeBps, args: [BigInt(bps)] }) }], `Fee set to ${fmtBpsPct(bps)}${willQueue ? ', effective after this round draws' : ''}.`)}
        >
          Set fee to {fmtBpsPct(bps)}
        </ActionButton>
        <StatusLine status={status} onDismiss={reset} />
      </div>
    </SubCard>
  );
}

// ---------------------------------------------------------------------------

function ThresholdControl({ admin, account, onChanged }: Props) {
  const { status, run, reset, busy } = useAdminAction(account, onChanged);
  const [text, setText] = useState(formatEther(admin.potThreshold));
  useEffect(() => setText(formatEther(admin.potThreshold)), [admin.potThreshold]);

  let wei: bigint | null = null;
  try {
    wei = text ? parseEther(text) : null;
  } catch {
    wei = null;
  }
  const tooLow = wei !== null && wei < admin.minPotThreshold;
  const drawsNow = wei !== null && !tooLow && wei <= admin.pot;

  return (
    <SubCard title="Pot threshold" hint={<>The pot draws a winner once it reaches this. Currently {fmtEth(admin.potThreshold, 4)}, pot at {fmtEth(admin.pot, 4)}.</>}>
      <Field
        label="New threshold"
        inputMode="decimal"
        value={text}
        suffix="ETH"
        error={tooLow ? `At least ${fmtEth(admin.minPotThreshold, 2)}.` : null}
        onChange={(e) => {
          const v = sanitizeAmountInput(e.target.value, 18);
          if (v !== null) setText(v);
        }}
      />
      {drawsNow && <Notice tone="warn">The pot already holds {fmtEth(admin.pot, 4)}, so the very next swap will draw a winner.</Notice>}
      <div className="flex items-center gap-3 flex-wrap">
        <ActionButton
          disabled={busy || wei === null || tooLow || wei === admin.potThreshold}
          onClick={() => wei !== null && run([{ label: 'Setting threshold', send: (c) => ({ fn: c.gswap.setPotThreshold, args: [wei] }) }], `Threshold set to ${fmtEth(wei, 4)}.`)}
        >
          Set threshold
        </ActionButton>
        <StatusLine status={status} onDismiss={reset} />
      </div>
    </SubCard>
  );
}

// ---------------------------------------------------------------------------

function PauseControl({ admin, account, onChanged }: Props) {
  const { status, run, reset, busy } = useAdminAction(account, onChanged);
  const [confirming, setConfirming] = useState(false);

  const pause = () => {
    setConfirming(false);
    run([{ label: 'Pausing', send: (c) => ({ fn: c.gswap.pause, args: [] }) }], 'GSwap is paused.');
  };
  const unpause = () => run([{ label: 'Unpausing', send: (c) => ({ fn: c.gswap.unpause, args: [] }) }], 'GSwap is live again.');

  return (
    <SubCard title="Swaps" hint="Pausing stops all swaps. Draws, claims and prize boosts keep working so nobody is stranded.">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className={`inline-flex items-center gap-2 text-sm font-bold ${admin.paused ? 'text-gs-bad' : 'text-gs-good'}`}>
          <span className={`w-2 h-2 rounded-full ${admin.paused ? 'bg-gs-bad' : 'bg-gs-good gswap-live-dot'}`} aria-hidden="true" />
          {admin.paused ? 'Paused' : 'Live'}
        </span>
        {admin.paused ? (
          <ActionButton disabled={busy} onClick={unpause}>
            Unpause swaps
          </ActionButton>
        ) : (
          <ActionButton danger disabled={busy} onClick={() => setConfirming(true)}>
            Pause swaps
          </ActionButton>
        )}
      </div>
      <StatusLine status={status} onDismiss={reset} />
      <ConfirmDialog open={confirming} title="Pause GSwap?" confirmLabel="Pause swaps" danger onConfirm={pause} onCancel={() => setConfirming(false)}>
        <p>Every swap will fail until you unpause. Players already in round #{admin.currentRound} keep their tickets.</p>
        <p>Draws, prize claims and prize boosts still work while paused.</p>
      </ConfirmDialog>
    </SubCard>
  );
}

// ---------------------------------------------------------------------------

function ManagersControl({ admin, account, readGswap, onChanged }: Props) {
  const gswapAddr = GSWAP_CONFIG.gswap!;
  const { status, run, reset, busy } = useAdminAction(account, onChanged);
  const [input, setInput] = useState('');
  const [managers, setManagers] = useState<string[] | null>(null);
  const [fromLogs, setFromLogs] = useState(true);
  const [lookup, setLookup] = useState<{ address: string; isManager: boolean | null } | null>(null);
  const [tick, setTick] = useState(0);

  const parsed = parseAddressInput(input);
  const inputError = input && !parsed ? 'Not a valid address (check the checksum).' : null;

  // Rebuild the list from PrizeManagerAdded/Removed events, then confirm each address with prizeManager(),
  // which is the source of truth. If the log query fails, fall back to addresses added from this browser.
  const reload = useCallback(async () => {
    if (!admin.managersSupported) return setManagers([]);
    let candidates: string[];
    try {
      const from = GSWAP_CONFIG.deployBlock;
      const [added, removed] = await Promise.all([
        readGswap.queryFilter(readGswap.filters.PrizeManagerAdded(), from),
        readGswap.queryFilter(readGswap.filters.PrizeManagerRemoved(), from),
      ]);
      const ordered = [...added, ...removed].sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index);
      const set = new Map<string, string>();
      for (const log of ordered) {
        const m = (log as any).args?.manager as string | undefined;
        if (!m) continue;
        if ((log as any).fragment?.name === 'PrizeManagerAdded') set.set(m.toLowerCase(), m);
        else set.delete(m.toLowerCase());
      }
      candidates = Array.from(set.values());
      setFromLogs(true);
    } catch (err) {
      console.warn('Prize manager log scan failed, using the local list', err);
      candidates = loadKnownManagers(gswapAddr);
      setFromLogs(false);
    }
    const flags = await Promise.all(candidates.map((a) => (readGswap.prizeManager(a) as Promise<boolean>).catch(() => false)));
    setManagers(candidates.filter((_, i) => flags[i]));
  }, [admin.managersSupported, gswapAddr, readGswap]);
  useEffect(() => {
    reload();
  }, [reload, tick]);

  useEffect(() => {
    if (!parsed || !admin.managersSupported) return setLookup(null);
    let cancelled = false;
    setLookup({ address: parsed, isManager: null });
    (readGswap.prizeManager(parsed) as Promise<boolean>)
      .then((v) => !cancelled && setLookup({ address: parsed, isManager: v }))
      .catch(() => !cancelled && setLookup({ address: parsed, isManager: null }));
    return () => {
      cancelled = true;
    };
  }, [parsed, admin.managersSupported, readGswap, tick]);

  const add = async (addr: string) => {
    const ok = await run([{ label: 'Adding prize manager', send: (c) => ({ fn: c.gswap.addPrizeManager, args: [addr] }) }], `${shortAddr(addr)} is now a prize manager.`);
    if (ok) {
      saveKnownManagers(gswapAddr, [...loadKnownManagers(gswapAddr), addr]);
      setInput('');
      setTick((n) => n + 1);
    }
  };
  const remove = async (addr: string) => {
    const ok = await run([{ label: 'Removing prize manager', send: (c) => ({ fn: c.gswap.removePrizeManager, args: [addr] }) }], `${shortAddr(addr)} is no longer a prize manager.`);
    if (ok) {
      saveKnownManagers(gswapAddr, loadKnownManagers(gswapAddr).filter((a) => a.toLowerCase() !== addr.toLowerCase()));
      setTick((n) => n + 1);
    }
  };

  if (!admin.managersSupported) {
    return (
      <SubCard title="Prize managers">
        <Notice tone="info">The deployed GSwap contract has no prize manager functions yet. This section activates once the updated contract is live.</Notice>
      </SubCard>
    );
  }

  return (
    <SubCard title="Prize managers" hint="Prize managers can add ETH, token and NFT prizes. They cannot change settings or move funds.">
      <div className="flex items-end gap-2">
        <span className="flex-1">
          <Field label="Wallet address" placeholder="0x..." value={input} error={inputError} onChange={(e) => setInput(e.target.value)} />
        </span>
        {lookup?.isManager ? (
          <ActionButton danger disabled={busy} onClick={() => remove(lookup.address)}>
            Remove
          </ActionButton>
        ) : (
          <ActionButton disabled={busy || !parsed || lookup?.isManager === null} onClick={() => parsed && add(parsed)}>
            Add
          </ActionButton>
        )}
      </div>
      {lookup && lookup.isManager !== null && (
        <p className="text-xs text-gs-muted">{lookup.isManager ? 'This address is already a prize manager.' : 'This address is not a prize manager.'}</p>
      )}
      <StatusLine status={status} onDismiss={reset} />

      <div>
        <p className="text-xs font-bold text-gs-muted mb-1.5">{fromLogs ? 'Current prize managers' : 'Managers added from this browser'}</p>
        {managers === null ? (
          <p className="text-xs text-gs-muted">Checking...</p>
        ) : managers.length === 0 ? (
          <p className="text-xs text-gs-muted">No prize managers yet.</p>
        ) : (
          <ul className="divide-y divide-gs-line rounded-xl ring-1 ring-gs-line">
            {managers.map((m) => (
              <li key={m} className="flex items-center justify-between gap-3 px-3 py-2">
                <a href={`${GSWAP_CONFIG.explorer}/address/${m}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs truncate hover:text-gs-glint" title={m}>
                  {m}
                </a>
                <button onClick={() => remove(m)} disabled={busy} className="shrink-0 text-xs font-bold text-[#f2a796] hover:underline disabled:opacity-40">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {!fromLogs && (
          <p className="mt-1.5 text-[11px] text-gs-muted">Could not read the contract&apos;s manager history, so this only shows managers added from this browser. Look up any address above to check it.</p>
        )}
      </div>
    </SubCard>
  );
}

// ---------------------------------------------------------------------------

function TransferControl({ admin, account, provider, onChanged }: Props) {
  const { status, run, reset, busy } = useAdminAction(account, onChanged);
  const [input, setInput] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [isContract, setIsContract] = useState<boolean | null>(null);

  const parsed = parseAddressInput(input);
  const sameAsOwner = parsed && parsed.toLowerCase() === admin.owner.toLowerCase();
  const error = input && !parsed ? 'Not a valid address (check the checksum).' : sameAsOwner ? 'That is already the owner.' : null;

  useEffect(() => {
    if (!parsed) return setIsContract(null);
    let cancelled = false;
    provider.getCode(parsed).then((code) => !cancelled && setIsContract(code !== '0x')).catch(() => !cancelled && setIsContract(null));
    return () => {
      cancelled = true;
    };
  }, [parsed, provider]);

  const transfer = () => {
    setConfirming(false);
    if (!parsed) return;
    run([{ label: 'Transferring ownership', send: (c) => ({ fn: c.gswap.transferOwnership, args: [parsed] }) }], `Ownership transferred to ${shortAddr(parsed)}.`);
  };

  return (
    <SubCard title="Transfer ownership" hint="Hands every owner power to another address. This happens immediately and cannot be undone from this wallet.">
      <Field
        label="New owner address"
        placeholder="0x..."
        value={input}
        error={error}
        note={parsed && !error && isContract !== null ? (isContract ? 'This address is a contract (for example a multisig).' : 'This address is a regular wallet.') : undefined}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <ActionButton danger disabled={busy || !parsed || !!error} onClick={() => setConfirming(true)}>
          Transfer ownership
        </ActionButton>
        <StatusLine status={status} onDismiss={reset} />
      </div>
      <ConfirmDialog
        open={confirming && !!parsed}
        title="Transfer ownership?"
        confirmLabel="Transfer ownership"
        danger
        typeToConfirm={parsed ? { value: parsed, prompt: 'Type the new owner address again to confirm' } : undefined}
        onConfirm={transfer}
        onCancel={() => setConfirming(false)}
      >
        <p>
          <strong className="text-gacc-cream">{parsed}</strong> becomes the owner the moment this confirms. There is no acceptance step, so if
          this address is wrong, owner access is lost for good.
        </p>
        <p>Your wallet will lose access to every owner setting on this panel.</p>
      </ConfirmDialog>
    </SubCard>
  );
}

// ---------------------------------------------------------------------------

export function OwnerControls(props: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <FeeControl {...props} />
      <ThresholdControl {...props} />
      <PauseControl {...props} />
      <ManagersControl {...props} />
      <div className="lg:col-span-2">
        <TransferControl {...props} />
      </div>
    </div>
  );
}
