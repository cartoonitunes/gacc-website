'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { GSWAP_CONFIG } from '@/lib/gswap/config';
import { BPS, entryWeightGain, holderMultiplierBps, sanitizeAmountInput, weightToTickets } from '@/lib/gswap/math';
import { fmtBpsPct, fmtEth, fmtMultiplier, fmtTickets, fmtToken } from '@/lib/gswap/format';
import { useQuote, type Direction } from './useQuote';
import { useSwapTx } from './useSwapTx';
import type { useGSwapData } from './useGSwapData';
import { Notice, Row, Skeleton, TokenPill } from './ui';
import { TxStatus } from './TxStatus';
import { useAutoSlippage } from './useAutoSlippage';
import { InfoTip } from './InfoTip';
import { TicketReward } from './TicketReward';
import { extrasChipText } from './Prizes';

type Data = ReturnType<typeof useGSwapData>;

// Stores 'auto' or a manual bps value. New key, so older saved values from the 1% default do not carry over.
const SLIPPAGE_KEY = 'gswap:slippage';
const PRESETS = [100, 200, 300];

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
  // null = Auto (sized from current pool depth); a number = the user's manual choice.
  const [manualBps, setManualBps] = useState<number | null>(null);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(SLIPPAGE_KEY));
    if (saved >= GSWAP_CONFIG.minSlippageBps && saved <= GSWAP_CONFIG.maxSlippageBps) setManualBps(saved);
  }, []);
  const setSlippage = (bps: number | null) => {
    setManualBps(bps);
    window.localStorage.setItem(SLIPPAGE_KEY, bps === null ? 'auto' : String(bps));
  };

  const feeBps = protocol?.feeBps ?? GSWAP_CONFIG.fallbackFeeBps;
  const taxBps = tax.enabled ? tax.bps : 0n;
  const isBuy = direction === 'buy';

  const auto = useAutoSlippage(provider);
  const slippageBps = manualBps ?? auto.bps;
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

  // Ticket preview: the weight this swap adds, the holder multiplier the draw would apply afterwards, and
  // the resulting chance at this round's prize.
  const preview = useMemo(() => {
    if (!quote) return null;
    const ethSide = quote.direction === 'buy' ? quote.amountIn : quote.grossOut;
    const gain = entryWeightGain(user?.buyVolume ?? 0n, user?.sellVolume ?? 0n, ethSide, quote.direction === 'buy');
    const balanceNow = user?.grandpaBalance ?? 0n;
    const balanceAfter = quote.direction === 'buy' ? balanceNow + quote.received : balanceNow > quote.amountIn ? balanceNow - quote.amountIn : 0n;
    const multNow = user?.multiplierBps ?? holderMultiplierBps(balanceNow);
    const multAfter = holderMultiplierBps(balanceAfter);

    let oddsPct: number | null = null;
    let prizeLabel: string | null = null;
    if (protocol) {
      // Other players' boosts are unknown without reading every balance, so they count at 1x here.
      const mine = user?.entryWeight ?? 0n;
      const myEff = ((mine + gain) * multAfter) / BPS;
      const others = protocol.totalWeight - mine;
      const denom = others + myEff;
      oddsPct = denom > 0n ? (Number(myEff) / Number(denom)) * 100 : null;
      const ethPrize = protocol.pot + protocol.boost;
      const extras = extrasChipText(protocol.queued);
      prizeLabel = ethPrize > 0n || extras ? `${fmtEth(ethPrize, 4)}${extras ? ` ${extras}` : ''}` : null;
    }
    return { tickets: weightToTickets(gain), multNow, multAfter, oddsPct, prizeLabel };
  }, [quote, user, protocol]);

  const slippageWarning =
    manualBps !== null && manualBps < auto.bps
      ? `Below the ${fmtBpsPct(auto.bps)} suggested for this pool. A single trade landing before yours could make the swap fail.`
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
      label:
        preview && preview.tickets > 0
          ? `${needsApproval ? 'Approve, sell' : isBuy ? 'Buy GRANDPA' : 'Sell'} & earn ${fmtTickets(preview.tickets)} ticket${fmtTickets(preview.tickets) === '1' ? '' : 's'}`
          : needsApproval ? 'Approve and sell GRANDPA' : isBuy ? 'Buy GRANDPA' : 'Sell GRANDPA',
      onClick: () => execute({ account: account!, quote, allowance: user.allowance, weightBefore: user.entryWeight }),
      disabled: false,
    };

  // Once the history refreshes after a winning draw, count the bonus prizes bundled into that round.
  const wonRound = phase.kind === 'success' && phase.result.wonPrize !== null ? phase.result.drawnRound : null;
  const wonBundle = wonRound !== null ? protocol?.history.find((r) => r.id === wonRound)?.bundle : null;
  const wonBonusCount = wonBundle ? wonBundle.tokens.length + wonBundle.nfts.length : 0;

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
          {manualBps === null ? `Auto ${fmtBpsPct(slippageBps)}` : fmtBpsPct(slippageBps)} slippage
        </button>
      </div>

      {/* Slippage settings */}
      {showSettings && (
        <div className="mb-3 rounded-2xl bg-gs-ink/60 ring-1 ring-gs-line p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-bold">Max slippage</span>
            <span className="text-xs text-gs-muted">Protects the amount you receive</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSlippage(null); setCustomSlippage(''); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold ring-1 transition-colors ${
                manualBps === null ? 'bg-gs-ochre/20 ring-gs-ochre text-gacc-cream' : 'ring-gs-line text-gs-muted hover:text-gacc-cream'
              }`}
            >
              Auto <span className="font-semibold opacity-80">{fmtBpsPct(auto.bps)}</span>
            </button>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { setSlippage(p); setCustomSlippage(''); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold ring-1 transition-colors ${
                  manualBps === p && !customSlippage ? 'bg-gs-ochre/20 ring-gs-ochre text-gacc-cream' : 'ring-gs-line text-gs-muted hover:text-gacc-cream'
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
            The GRANDPA pool is small, so another trade landing just before yours can move the price. Auto sizes slippage to cover one
            0.1 ETH trade at the pool&apos;s current depth. Quotes already show what reaches your wallet, so slippage only has to cover
            price movement.
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
          <span className="flex items-center gap-1.5">
            <span className="font-bold uppercase tracking-wider">You receive</span>
            {isBuy && tax.enabled && (
              <InfoTip label="Why this amount">
                Every buy contributes {fmtBpsPct(tax.bps)} to the Country Club, which permanently acquires and locks Grandpa Ape NFTs. This is
                the amount that reaches your wallet.
              </InfoTip>
            )}
          </span>
          {user && <span>Balance {fmtToken(balanceOut, { compact: isBuy })}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 text-3xl sm:text-4xl font-extrabold truncate" aria-live="polite">
            {quoting && amountIn > 0n ? <Skeleton className="h-9 w-40" /> : quote ? fmtToken(quote.received) : <span className="text-gacc-cream/25">0</span>}
          </div>
          <TokenPill symbol={isBuy ? 'GRANDPA' : 'ETH'} />
        </div>
      </div>

      {/* The reward: tickets this swap earns */}
      {preview && (
        <TicketReward
          tickets={preview.tickets}
          isBuy={isBuy}
          multiplierBps={preview.multAfter}
          oddsPct={preview.oddsPct}
          prizeLabel={preview.prizeLabel}
          live={live}
        />
      )}
      {live && preview && !isBuy && preview.multAfter < preview.multNow && (
        <div className="mt-2">
          <Notice tone="warn">
            Selling this much lowers your holder boost from {fmtMultiplier(preview.multNow)} to {fmtMultiplier(preview.multAfter)} on every ticket you hold.
          </Notice>
        </div>
      )}

      {/* Fine print, collapsed by default */}
      {quote && (
        <div className="mt-3 rounded-2xl ring-1 ring-gs-line px-4 py-1.5">
          <button onClick={() => setShowDetails((v) => !v)} aria-expanded={showDetails} className="w-full flex items-center justify-between gap-3 py-1.5 text-[13px]">
            <span className="font-semibold text-gs-muted">Swap details</span>
            <span className="flex items-center gap-2 text-gs-muted">
              <span className="truncate">
                {quote.direction === 'buy'
                  ? `1 ETH = ${fmtToken((quote.received * 10n ** 18n) / quote.amountIn, { compact: true })} GRANDPA`
                  : `1M GRANDPA = ${fmtEth((quote.received * 10n ** 24n) / quote.amountIn, 5)}`}
              </span>
              <svg viewBox="0 0 20 20" className={`w-4 h-4 shrink-0 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="currentColor" aria-hidden="true">
                <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
              </svg>
            </span>
          </button>
          {showDetails && (
            <dl className="border-t border-gs-line pt-1.5 pb-1">
              <Row
                label={`Minimum received (${fmtBpsPct(slippageBps)} slippage)`}
                value={quote.direction === 'buy' ? `${fmtToken(quote.minReceived)} GRANDPA` : fmtEth(quote.minReceived, 6)}
                hint="The swap is cancelled if less than this would reach your wallet."
              />
              <Row
                label="Price impact"
                value={<span className={impactTone}>{impact === null ? '-' : impact < 0.01 ? '<0.01%' : `${impact.toFixed(2)}%`}</span>}
              />
              <Row label={`To the prize pot (${fmtBpsPct(feeBps)})`} value={fmtEth(quote.fee, 6)} />
              {quote.direction === 'buy' && taxBps > 0n && (
                <Row
                  label={`To the Country Club (${fmtBpsPct(taxBps)})`}
                  value={`${fmtToken(quote.tax)} GRANDPA`}
                  hint="Used to permanently acquire and lock Grandpa Ape NFTs in the Country Club."
                />
              )}
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

      <TxStatus phase={phase} onDismiss={reset} bonusCount={wonBonusCount} />
    </div>
  );
}
