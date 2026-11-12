'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { GSWAP_CONFIG } from '@/lib/gswap/config';
import { entryWeightGain, holderMultiplierBps, sanitizeAmountInput, weightToEntries } from '@/lib/gswap/math';
import { fmtBpsPct, fmtEntries, fmtEth, fmtMultiplier, fmtToken } from '@/lib/gswap/format';
import { useQuote, type Direction } from './useQuote';
import { useSwapTx } from './useSwapTx';
import type { useGSwapData } from './useGSwapData';
import { Notice, Row, Skeleton, TokenPill } from './ui';
import { TxStatus } from './TxStatus';

type Data = ReturnType<typeof useGSwapData>;

const SLIPPAGE_KEY = 'gswap:slippageBps';
const PRESETS = [50, 100, 200, 300];

async function switchToMainnet() {
  const eth = (window as any).ethereum;
  if (!eth) return;
  await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1' }] });
}

export function SwapCard({ data }: { data: Data }) {
  const { account, isConnected, connectWallet, loading: walletLoading, error: walletError } = useWallet();
  const { live, tax, protocol, user, provider, refresh } = data;

  const [direction, setDirection] = useState<Direction>('buy');
  const [amountText, setAmountText] = useState('');
  const [slippageBps, setSlippageBps] = useState<number>(GSWAP_CONFIG.defaultSlippageBps);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(SLIPPAGE_KEY));
    if (saved >= GSWAP_CONFIG.minSlippageBps && saved <= GSWAP_CONFIG.maxSlippageBps) setSlippageBps(saved);
  }, []);
  const setSlippage = (bps: number) => {
    setSlippageBps(bps);
    window.localStorage.setItem(SLIPPAGE_KEY, String(bps));
  };

  const feeBps = protocol?.feeBps ?? GSWAP_CONFIG.fallbackFeeBps;
  const taxBps = tax.enabled ? tax.bps : 0n;
  const isBuy = direction === 'buy';

  const { amountIn, quote, quoting, error: quoteError } = useQuote({ provider, direction, amountText, feeBps, taxBps, slippageBps });
  const { phase, execute, reset } = useSwapTx(refresh);
  const busy = phase.kind === 'wallet' || phase.kind === 'pending';

  // Clear the amount after a confirmed swap so the old quote cannot be resubmitted by accident.
  useEffect(() => {
    if (phase.kind === 'success') setAmountText('');
  }, [phase.kind]);

  const balanceIn = user ? (isBuy ? user.ethBalance : user.grandpaBalance) : null;
  const balanceOut = user ? (isBuy ? user.grandpaBalance : user.ethBalance) : null;
  const insufficient = balanceIn !== null && amountIn > balanceIn;
  const lowGas = isBuy && user !== null && !insufficient && amountIn > 0n && user.ethBalance - amountIn < GSWAP_CONFIG.gasReserveWei;
  const needsApproval = !isBuy && user !== null && amountIn > 0n && user.allowance < amountIn;

  const onMax = () => {
    if (balanceIn === null) return;
    const max = isBuy ? (balanceIn > GSWAP_CONFIG.gasReserveWei ? balanceIn - GSWAP_CONFIG.gasReserveWei : 0n) : balanceIn;
    setAmountText(formatUnits(max, 18));
  };

  const flip = () => {
    setDirection(isBuy ? 'sell' : 'buy');
    setAmountText('');
    if (phase.kind !== 'idle' && !busy) reset();
  };

  // Raffle preview: the weight this swap adds and the multiplier the draw would apply afterwards.
  const preview = useMemo(() => {
    if (!quote) return null;
    const ethSide = quote.direction === 'buy' ? quote.amountIn : quote.grossOut;
    const gain = entryWeightGain(user?.buyVolume ?? 0n, user?.sellVolume ?? 0n, ethSide, quote.direction === 'buy');
    const balanceNow = user?.grandpaBalance ?? 0n;
    const balanceAfter = quote.direction === 'buy' ? balanceNow + quote.received : balanceNow > quote.amountIn ? balanceNow - quote.amountIn : 0n;
    const multNow = user?.multiplierBps ?? holderMultiplierBps(balanceNow);
    const multAfter = holderMultiplierBps(balanceAfter);
    return { entries: weightToEntries(gain), multNow, multAfter };
  }, [quote, user]);

  const slippageWarning =
    slippageBps < GSWAP_CONFIG.lowSlippageWarnBps
      ? 'Very low slippage. Small price moves will make the swap fail.'
      : slippageBps > GSWAP_CONFIG.highSlippageWarnBps
        ? 'High slippage leaves room for a worse price or a sandwich attack.'
        : null;

  const wrongNetwork = !!walletError && /network/i.test(walletError);

  let button: { label: string; onClick?: () => void; disabled: boolean };
  if (!live) button = { label: 'Swaps open at launch', disabled: true };
  else if (wrongNetwork) button = { label: 'Switch to Ethereum', onClick: async () => { try { await switchToMainnet(); await connectWallet(); } catch { /* user dismissed */ } }, disabled: false };
  else if (!isConnected) button = { label: walletLoading ? 'Connecting...' : 'Connect wallet', onClick: connectWallet, disabled: walletLoading };
  else if (protocol?.paused) button = { label: 'GSwap is paused', disabled: true };
  else if (phase.kind === 'wallet') button = { label: phase.step === 'approve' ? 'Approve in your wallet...' : 'Confirm in your wallet...', disabled: true };
  else if (phase.kind === 'pending') button = { label: phase.step === 'approve' ? 'Approving GRANDPA...' : 'Swapping...', disabled: true };
  else if (amountIn === 0n) button = { label: 'Enter an amount', disabled: true };
  else if (insufficient) button = { label: `Insufficient ${isBuy ? 'ETH' : 'GRANDPA'} balance`, disabled: true };
  else if (quoteError) button = { label: 'No quote available', disabled: true };
  else if (quoting || !quote || !user) button = { label: 'Fetching best price...', disabled: true };
  else
    button = {
      label: needsApproval ? 'Approve and sell GRANDPA' : isBuy ? 'Buy GRANDPA' : 'Sell GRANDPA',
      onClick: () => execute({ account: account!, quote, allowance: user.allowance }),
      disabled: false,
    };

  const impact = quote?.priceImpactPct ?? null;
  const impactTone = impact === null ? '' : impact > 5 ? 'text-gs-bad' : impact > 2 ? 'text-[#f3c98b]' : 'text-gs-good';

  return (
    <div className="gswap-card gswap-card-gilded rounded-3xl p-4 sm:p-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 rounded-full bg-gs-ink/70 ring-1 ring-gs-line p-1" role="tablist" aria-label="Swap direction">
          {(['buy', 'sell'] as const).map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={direction === d}
              onClick={() => direction !== d && flip()}
              className={`px-4 py-1.5 rounded-full text-sm font-extrabold transition-colors ${
                direction === d ? 'bg-gs-raised text-gacc-cream ring-1 ring-gs-ochre/50' : 'text-gs-muted hover:text-gacc-cream'
              }`}
            >
              {d === 'buy' ? 'Buy' : 'Sell'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowSettings((s) => !s)}
          aria-expanded={showSettings}
          aria-label="Slippage settings"
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-colors ${
            showSettings ? 'ring-gs-ochre/60 bg-gs-raised' : 'ring-gs-line hover:ring-gs-ochre/40'
          } ${slippageWarning ? 'text-[#f3c98b]' : 'text-gs-muted'}`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" strokeLinecap="round" />
            <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
          </svg>
          {fmtBpsPct(slippageBps)} slippage
        </button>
      </div>

      {/* Slippage settings */}
      {showSettings && (
        <div className="mb-3 rounded-2xl bg-gs-ink/60 ring-1 ring-gs-line p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-bold">Max slippage</span>
            <span className="text-xs text-gs-muted">{isBuy ? 'Applied after the buy tax' : 'Sells are not taxed'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { setSlippage(p); setCustomSlippage(''); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold ring-1 transition-colors ${
                  slippageBps === p && !customSlippage ? 'bg-gs-ochre/20 ring-gs-ochre text-gacc-cream' : 'ring-gs-line text-gs-muted hover:text-gacc-cream'
                }`}
              >
                {fmtBpsPct(p)}
              </button>
            ))}
            <label className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ring-1 ${customSlippage ? 'ring-gs-ochre bg-gs-ochre/10' : 'ring-gs-line'}`}>
              <input
                inputMode="decimal"
                placeholder="Custom"
                aria-label="Custom slippage percent"
                value={customSlippage}
                onChange={(e) => {
                  const v = sanitizeAmountInput(e.target.value, 2);
                  if (v === null) return;
                  setCustomSlippage(v);
                  const bps = Math.round(Number(v) * 100);
                  if (v && bps >= GSWAP_CONFIG.minSlippageBps && bps <= GSWAP_CONFIG.maxSlippageBps) setSlippage(bps);
                }}
                className="w-16 text-sm font-bold outline-none"
              />
              <span className="text-sm text-gs-muted">%</span>
            </label>
          </div>
          {customSlippage && (Number(customSlippage) * 100 < GSWAP_CONFIG.minSlippageBps || Number(customSlippage) * 100 > GSWAP_CONFIG.maxSlippageBps) && (
            <p className="mt-2 text-xs text-gs-bad">
              Enter between {fmtBpsPct(GSWAP_CONFIG.minSlippageBps)} and {fmtBpsPct(GSWAP_CONFIG.maxSlippageBps)}.
            </p>
          )}
          {slippageWarning && <p className="mt-2 text-xs text-[#f3c98b]">{slippageWarning}</p>}
          <p className="mt-2 text-xs text-gs-muted leading-relaxed">
            Quotes already subtract the {fmtBpsPct(tax.bps)} buy tax, so you do not need to add it here. Slippage only covers price movement.
          </p>
        </div>
      )}

      {/* You pay */}
      <div className="rounded-2xl bg-gs-ink/70 ring-1 ring-gs-line focus-within:ring-gs-ochre/60 p-4 transition-shadow">
        <div className="flex justify-between text-xs text-gs-muted mb-2">
          <span className="font-bold uppercase tracking-wider">You pay</span>
          {user && (
            <span className="flex items-center gap-2">
              Balance {fmtToken(balanceIn, { compact: !isBuy })}
              <button onClick={onMax} className="font-extrabold text-gs-glint hover:text-gacc-cream">
                MAX
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            aria-label={`Amount of ${isBuy ? 'ETH' : 'GRANDPA'} to swap`}
            value={amountText}
            onChange={(e) => {
              const v = sanitizeAmountInput(e.target.value, 18);
              if (v !== null) setAmountText(v);
              if (phase.kind === 'success' || phase.kind === 'error') reset();
            }}
            className={`min-w-0 flex-1 text-3xl sm:text-4xl font-extrabold outline-none ${insufficient ? 'text-gs-bad' : ''}`}
          />
          <TokenPill symbol={isBuy ? 'ETH' : 'GRANDPA'} />
        </div>
      </div>

      {/* Flip */}
      <div className="relative h-2 flex justify-center">
        <button
          onClick={flip}
          aria-label="Switch buy and sell"
          className="absolute -top-4 z-10 w-10 h-10 rounded-xl bg-gs-raised ring-4 ring-gs-night text-gs-glint hover:text-gacc-cream hover:rotate-180 transition-transform duration-300 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
            <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* You receive */}
      <div className="rounded-2xl bg-gs-ink/40 ring-1 ring-gs-line p-4">
        <div className="flex justify-between text-xs text-gs-muted mb-2">
          <span className="font-bold uppercase tracking-wider">{isBuy ? 'You receive, after tax' : 'You receive'}</span>
          {user && <span>Balance {fmtToken(balanceOut, { compact: isBuy })}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 text-3xl sm:text-4xl font-extrabold truncate" aria-live="polite">
            {quoting && amountIn > 0n ? <Skeleton className="h-9 w-40" /> : quote ? fmtToken(quote.received) : <span className="text-gacc-cream/25">0</span>}
          </div>
          <TokenPill symbol={isBuy ? 'GRANDPA' : 'ETH'} />
        </div>
        {isBuy && (
          <p className="mt-2 text-xs text-gs-muted">
            {tax.enabled
              ? `GRANDPA charges a ${fmtBpsPct(tax.bps)} buy tax. This amount is what reaches your wallet.`
              : 'The GRANDPA buy tax is currently switched off.'}
          </p>
        )}
      </div>

      {/* Raffle preview */}
      {live && preview && preview.entries > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-gs-ochre/15 to-transparent ring-1 ring-gs-ochre/30 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden="true">🎟️</span>
            <div>
              <p className="text-sm font-extrabold">+{fmtEntries(preview.entries)} raffle entries</p>
              <p className="text-xs text-gs-muted">{isBuy ? 'Buys earn full entries' : 'Sells earn half entries'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold text-gs-glint">{fmtMultiplier(preview.multAfter)}</p>
            <p className="text-xs text-gs-muted">holder bonus</p>
          </div>
        </div>
      )}
      {live && preview && !isBuy && preview.multAfter < preview.multNow && (
        <div className="mt-2">
          <Notice tone="warn">
            Selling this much lowers your holder bonus from {fmtMultiplier(preview.multNow)} to {fmtMultiplier(preview.multAfter)} for every entry you hold.
          </Notice>
        </div>
      )}

      {/* Details */}
      {quote && (
        <div className="mt-3 rounded-2xl ring-1 ring-gs-line px-4 py-2">
          <button onClick={() => setShowDetails((s) => !s)} aria-expanded={showDetails} className="w-full flex items-center justify-between py-1.5 text-[13px]">
            <span className="text-gs-muted">
              {quote.direction === 'buy'
                ? `1 ETH = ${fmtToken((quote.received * 10n ** 18n) / quote.amountIn, { compact: true })} GRANDPA after tax and fees`
                : `1M GRANDPA = ${fmtEth((quote.received * 10n ** 24n) / quote.amountIn, 5)} after fees`}
            </span>
            <svg viewBox="0 0 20 20" className={`w-4 h-4 text-gs-muted transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="currentColor" aria-hidden="true">
              <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
            </svg>
          </button>
          {showDetails && (
            <dl className="border-t border-gs-line pt-1.5 pb-1">
              {quote.direction === 'buy' ? (
                <>
                  <Row label={`GSwap fee (${fmtBpsPct(feeBps)}, to the pot)`} value={fmtEth(quote.fee, 6)} />
                  <Row label="Pool output before tax" value={`${fmtToken(quote.poolOut)} GRANDPA`} />
                  <Row label={`Buy tax (${fmtBpsPct(taxBps)})`} value={taxBps > 0n ? `-${fmtToken(quote.tax)} GRANDPA` : 'Off'} />
                  <Row label="You receive" value={`${fmtToken(quote.received)} GRANDPA`} emphasis />
                  <Row
                    label={`Minimum after tax (${fmtBpsPct(slippageBps)} slippage)`}
                    value={`${fmtToken(quote.minReceived)} GRANDPA`}
                    hint="GSwap reverts the swap if less than this reaches your wallet."
                  />
                </>
              ) : (
                <>
                  <Row label="Pool output" value={fmtEth(quote.grossOut, 6)} />
                  <Row label={`GSwap fee (${fmtBpsPct(feeBps)}, to the pot)`} value={`-${fmtEth(quote.fee, 6)}`} />
                  <Row label="Sell tax" value="None" />
                  <Row label="You receive" value={fmtEth(quote.received, 6)} emphasis />
                  <Row label={`Minimum received (${fmtBpsPct(slippageBps)} slippage)`} value={fmtEth(quote.minReceived, 6)} />
                </>
              )}
              <Row
                label="Price impact"
                value={<span className={impactTone}>{impact === null ? '-' : impact < 0.01 ? '<0.01%' : `${impact.toFixed(2)}%`}</span>}
              />
              <Row label="Route" value="Uniswap V3, 1% pool" />
            </dl>
          )}
        </div>
      )}

      {/* Inline notices */}
      <div className="mt-3 space-y-2">
        {!live && (
          <Notice>GSwap is not deployed yet. Quotes are live from the Uniswap pool so you can preview a swap. Swapping opens at launch.</Notice>
        )}
        {live && protocol?.paused && <Notice tone="warn">GSwap is paused by its owner. Swaps and draws resume once it is unpaused.</Notice>}
        {walletError && !wrongNetwork && <Notice tone="bad">{walletError}</Notice>}
        {wrongNetwork && <Notice tone="warn">Your wallet is on another network. GSwap runs on Ethereum mainnet.</Notice>}
        {quoteError && amountIn > 0n && <Notice tone="bad">{quoteError}</Notice>}
        {lowGas && <Notice tone="warn">This leaves less than {fmtEth(GSWAP_CONFIG.gasReserveWei, 3)} for gas. The transaction may not go through.</Notice>}
        {impact !== null && impact > 5 && <Notice tone="bad">High price impact ({impact.toFixed(1)}%). Consider a smaller swap.</Notice>}
        {needsApproval && !busy && phase.kind !== 'error' && (
          <Notice>Selling takes two transactions: approve exactly this amount of GRANDPA, then swap.</Notice>
        )}
      </div>

      <button
        onClick={button.onClick}
        disabled={button.disabled}
        className="gswap-btn-primary mt-4 w-full rounded-2xl py-4 text-base sm:text-lg"
      >
        {busy && <span className="inline-block w-4 h-4 mr-2 align-[-2px] rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />}
        {button.label}
      </button>

      <TxStatus phase={phase} onDismiss={reset} />
    </div>
  );
}
