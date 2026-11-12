'use client';

import { ReactNode } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { GSWAP_CONFIG } from '@/lib/gswap/config';
import { HOLDER_BONUS_FLOOR, holderMultiplierBps, MAX_HOLDER_MULTIPLIER_BPS, nextMultiplierStep, weightToEntries } from '@/lib/gswap/math';
import { fmtBpsPct, fmtEntries, fmtEth, fmtMultiplier, fmtToken, shortAddr } from '@/lib/gswap/format';
import type { useGSwapData } from './useGSwapData';
import { SectionHeading, Skeleton } from './ui';
import { WalletButton } from './GSwapNav';
import { extrasChipText, PrizeChips, PrizeShowcase } from './Prizes';
import { ClaimButton } from './ClaimButton';

type Data = ReturnType<typeof useGSwapData>;

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-gs-ink/50 ring-1 ring-gs-line p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gs-muted">{label}</p>
      <p className="mt-1.5 text-xl sm:text-2xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gs-muted">{sub}</p>}
    </div>
  );
}

function PreLaunch({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gs-line bg-gs-ink/40 p-6 text-center text-sm text-gs-muted">{children}</div>
  );
}

// ---------------------------------------------------------------------------

export function Hero({ data, children }: { data: Data; children: ReactNode }) {
  const { protocol, live } = data;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 md:pt-16 md:pb-20 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
      <div>
        <p className="gswap-eyebrow mb-4">Grandpa Ape Country Club presents</p>
        <h1 className="gswap-title text-6xl sm:text-7xl md:text-8xl">
          <span className="gswap-gold-text pr-2">GSwap</span>
        </h1>
        <p className="mt-5 text-2xl sm:text-3xl font-extrabold italic leading-tight">
          Swap GRANDPA.
          <br />
          Win the pot.
        </p>
        <p className="mt-5 max-w-xl text-[15px] sm:text-base text-gs-muted leading-relaxed">
          Every swap through GSwap sends a small fee into a shared ETH prize pot and earns you raffle entries. When the pot fills, one
          swapper is drawn and wins the ETH plus any bonus tokens and NFTs in the round, paid automatically right inside the swap that
          tipped it over. Hold more GRANDPA and your entries count up to twice as much.
        </p>

        <div className="mt-7 flex flex-wrap gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-full bg-gs-panel/80 ring-1 ring-gs-line px-3.5 py-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${live && !protocol?.paused ? 'bg-gs-good gswap-live-dot' : 'bg-gs-ochre'}`} aria-hidden="true" />
            {!live ? 'Launching soon' : protocol?.paused ? 'Paused' : protocol ? `Round #${protocol.currentRound} live` : 'Connecting...'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-gs-panel/80 ring-1 ring-gs-line px-3.5 py-2 text-sm">
            Prize{' '}
            <strong className="tabular-nums">
              {live ? protocol ? fmtEth(protocol.pot + protocol.boost, 4) : <Skeleton className="h-4 w-16" /> : 'opens at launch'}
            </strong>
            {protocol && extrasChipText(protocol.queued) && <span className="text-gs-glint font-bold">{extrasChipText(protocol.queued)}</span>}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-gs-panel/80 ring-1 ring-gs-line px-3.5 py-2 text-sm">
            Fee <strong>{fmtBpsPct(protocol?.feeBps ?? GSWAP_CONFIG.fallbackFeeBps)}</strong>
          </span>
        </div>
      </div>

      <div id="swap" className="relative w-full max-w-[480px] mx-auto lg:mx-0 lg:justify-self-end scroll-mt-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/gswap/grandpa-640.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-10 w-44 sm:w-52 rounded-full opacity-[0.16] blur-[1px] rotate-6 hidden sm:block"
        />
        {children}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function RoundPanel({ data }: { data: Data }) {
  const { protocol, live, loading, provider } = data;
  if (!live) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeading id="round" eyebrow="The prize" title="Current round" />
        <PreLaunch>The prize, round and entries show up here as soon as GSwap is deployed.</PreLaunch>
      </section>
    );
  }

  const pot = protocol?.pot ?? 0n;
  const boost = protocol?.boost ?? 0n;
  const threshold = protocol?.potThreshold ?? 0n;
  // Only the fee pot counts toward the draw target; boosts are added to the prize at the draw.
  const pct = threshold > 0n ? Math.min(100, Number((pot * 10_000n) / threshold) / 100) : 0;
  const ready = threshold > 0n && pot >= threshold;
  const status = !protocol ? null : protocol.paused ? 'Paused' : ready ? 'Ready to draw' : 'Filling';

  const ethCard = (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gs-muted">ETH prize</p>
        {status && (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ring-1 ${
              status === 'Paused' ? 'ring-gs-bad/50 text-gs-bad' : ready ? 'ring-gs-glint text-gs-glint' : 'ring-gs-good/50 text-gs-good'
            }`}
          >
            {status}
          </span>
        )}
      </div>
      <p className="mt-1 gswap-title text-5xl sm:text-6xl gswap-gold-text tabular-nums">
        {protocol ? fmtToken(pot + boost, { max: 4 }) : loading ? <Skeleton className="h-12 w-40" /> : '-'}
        <span className="ml-2 text-2xl not-italic text-gs-muted" style={{ WebkitTextFillColor: '#a8977c' }}>
          ETH
        </span>
      </p>
      {boost > 0n && (
        <p className="mt-1.5 text-xs text-gs-muted">
          {fmtEth(pot, 4)} from fees plus <span className="text-gs-glint font-bold">{fmtEth(boost, 4)} boost</span>
        </p>
      )}

      <div className="mt-6">
        <div className="relative h-4 rounded-full bg-gs-ink ring-1 ring-gs-line overflow-visible" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Pot progress toward the draw">
          <div className="gswap-progress h-full rounded-full" style={{ width: `${pct}%` }} />
          {/* The flag on the green: the draw target. */}
          <span className="absolute -right-1 -top-7 text-xl" aria-hidden="true">⛳</span>
        </div>
        <div className="mt-2.5 flex justify-between text-xs text-gs-muted tabular-nums">
          <span>{pct.toFixed(1)}% to the draw</span>
          <span>Target {protocol ? fmtEth(threshold, 3) : '-'}</span>
        </div>
        <p className="mt-3 text-sm text-gs-muted">
          {protocol?.paused
            ? 'GSwap is paused, so no fees are collected and no draw can happen.'
            : ready
              ? 'The pot is full. The next swap draws the winner.'
              : protocol
                ? `${fmtEth(threshold - pot, 4)} more in fees until the draw.`
                : null}
        </p>
      </div>
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading id="round" eyebrow="The prize" title={protocol ? `Round #${protocol.currentRound}` : 'Current round'}>
        The pot fills from the GSwap fee on every buy and sell. The swap that pushes it over the target draws the winner on the spot,
        and the winner takes everything in the prize.
      </SectionHeading>

      <div className="gswap-card rounded-3xl p-5 sm:p-7">
        <PrizeShowcase provider={provider} raw={protocol?.queued ?? { tokens: [], nfts: [] }} ethCard={ethCard} />

        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Players" value={protocol ? protocol.participants : <Skeleton />} sub="this round" />
          <Stat label="Entries" value={protocol ? fmtEntries(weightToEntries(protocol.totalWeight)) : <Skeleton />} sub="before holder bonus" />
          <Stat label="Rounds drawn" value={protocol ? protocol.completedRounds : <Skeleton />} />
          {/* totalLifetimeVolume() sums amountIn across buys (ETH) and sells (GRANDPA), so it is not shown as a volume. */}
          <Stat label="Swappers" value={protocol ? protocol.uniqueSwappers : <Skeleton />} sub="all time" />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function MultiplierMeter({ bps }: { bps: bigint }) {
  const pct = Math.min(100, Math.max(0, (Number(bps) - 10_000) / 100));
  return (
    <div>
      <div className="relative h-2.5 rounded-full bg-gs-ink ring-1 ring-gs-line">
        <div className="gswap-progress h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-gs-muted">
        <span>1.00x</span>
        <span>2.00x</span>
      </div>
    </div>
  );
}

export function YourStats({ data }: { data: Data }) {
  const { isConnected } = useWallet();
  const { live } = data;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading eyebrow="Your card" title="Your stats" />
      {!isConnected ? (
        <div className="gswap-card rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <p className="text-gs-muted text-center sm:text-left">Connect your wallet to see your entries, odds, holder bonus and wins.</p>
          <WalletButton />
        </div>
      ) : (
        <StatsBody data={data} />
      )}
      {isConnected && !live && (
        <p className="mt-3 text-xs text-gs-muted">Entries, odds and wins start counting when GSwap launches. Your holder bonus is live now.</p>
      )}
    </section>
  );
}

function StatsBody({ data }: { data: Data }) {
  const { user, protocol, live, wins } = data;
  const mult = user?.multiplierBps ?? 10_000n;
  const next = user ? nextMultiplierStep(user.grandpaBalance) : null;
  const effective = user ? (user.entryWeight * mult) / 10_000n : 0n;
  let odds: number | null = null;
  if (user && protocol && protocol.totalWeight > 0n && user.entryWeight > 0n) {
    // Other players' multipliers are unknown without reading every balance, so this applies only yours.
    const denom = protocol.totalWeight - user.entryWeight + effective;
    odds = denom > 0n ? (Number(effective) / Number(denom)) * 100 : 0;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
      <div className="gswap-card rounded-3xl p-5 sm:p-6 grid grid-cols-2 gap-3 content-start">
        <Stat label="Your entries" value={user ? (live ? fmtEntries(weightToEntries(user.entryWeight)) : '0') : <Skeleton />} sub="this round" />
        <Stat label="Est. odds" value={odds === null ? (user ? '0%' : <Skeleton />) : `${odds < 0.01 ? '<0.01' : odds.toFixed(2)}%`} sub="with your holder bonus" />
        <Stat
          label="Wins"
          value={user ? wins.count : <Skeleton />}
          sub={wins.count > 0 ? `${fmtEth(wins.totalETH, 4)} won` : 'No wins yet'}
        />
        <Stat label="GSwap swaps" value={user ? user.swapCount : <Skeleton />} sub="all time" />
      </div>

      <div className="gswap-card gswap-card-gilded rounded-3xl p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gs-muted">Holder bonus</p>
            <p className="mt-1 gswap-title text-5xl gswap-gold-text">{user ? fmtMultiplier(mult) : <Skeleton className="h-10 w-28" />}</p>
          </div>
          <p className="text-right text-sm text-gs-muted">
            Holding
            <br />
            <strong className="text-gacc-cream">{user ? fmtToken(user.grandpaBalance, { compact: true }) : '-'}</strong> GRANDPA
          </p>
        </div>
        <div className="mt-5">
          <MultiplierMeter bps={mult} />
        </div>
        <p className="mt-4 text-sm text-gs-muted leading-relaxed">
          {!user
            ? ' '
            : mult >= MAX_HOLDER_MULTIPLIER_BPS
              ? 'Maxed out. Every entry you hold counts double at the draw.'
              : next
                ? `Hold ${fmtToken(next.balance - user.grandpaBalance, { compact: true })} more GRANDPA to reach ${fmtMultiplier(next.bps)}.`
                : null}
        </p>
        <p className="mt-2 text-xs text-gs-muted">Read from your live balance at the moment of the draw, so it applies to all your entries.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function PastWinners({ data }: { data: Data }) {
  const { account } = useWallet();
  const { protocol, live, loading, provider, refresh } = data;
  const me = account?.toLowerCase();
  const rows = protocol?.history.slice(0, GSWAP_CONFIG.historyDisplay) ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading id="winners" eyebrow="Hall of fame" title="Past winners" />
      {!live ? (
        <PreLaunch>Winners will be listed here, round by round.</PreLaunch>
      ) : !protocol ? (
        <div className="gswap-card rounded-3xl p-6 space-y-3">
          {loading ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />) : <p className="text-sm text-gs-muted">Could not load winners.</p>}
        </div>
      ) : rows.length === 0 ? (
        <PreLaunch>No rounds drawn yet. The first winner is one full pot away.</PreLaunch>
      ) : (
        <div className="gswap-card rounded-3xl overflow-hidden">
          <ul className="divide-y divide-gs-line">
            {rows.map((r) => {
              const isMe = me && r.winner.toLowerCase() === me;
              return (
                <li key={r.id} className={`px-4 sm:px-6 py-3.5 ${isMe ? 'bg-gs-glint/10' : ''}`}>
                  <div className="flex items-center gap-3 sm:gap-5">
                    <span className="w-12 shrink-0 text-sm font-extrabold text-gs-muted tabular-nums">#{r.id}</span>
                    <a
                      href={`${GSWAP_CONFIG.explorer}/address/${r.winner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate font-bold tabular-nums hover:text-gs-glint"
                      title={r.winner}
                    >
                      {shortAddr(r.winner)}
                      {isMe && <span className="ml-2 rounded-full bg-gs-glint/20 px-2 py-0.5 text-[11px] font-extrabold text-gs-glint">YOU</span>}
                    </a>
                    <span className="hidden sm:inline text-sm text-gs-muted tabular-nums">{r.participants} player{r.participants === 1 ? '' : 's'}</span>
                    <a
                      href={`${GSWAP_CONFIG.explorer}/block/${r.drawnAtBlock}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden md:inline text-xs text-gs-muted hover:text-gacc-cream tabular-nums"
                    >
                      Block {r.drawnAtBlock.toLocaleString('en-US')}
                    </a>
                    <span className="shrink-0 font-extrabold gswap-gold-text tabular-nums">{fmtEth(r.prizeETH, 4)}</span>
                  </div>
                  {r.settled === false && (
                    <div className="mt-2 pl-[3.75rem] sm:pl-[4.25rem] flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-[#c47f34]/15 ring-1 ring-[#c47f34]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#f3c98b]">
                        {isMe ? 'Part of your prize could not be sent automatically' : 'Prize waiting to be claimed'}
                      </span>
                      {isMe && account && <ClaimButton roundId={r.id} account={account} onDone={refresh} />}
                    </div>
                  )}
                  {r.bundle && r.bundle.tokens.length + r.bundle.nfts.length > 0 && (
                    <div className="mt-2 pl-[3.75rem] sm:pl-[4.25rem] flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gs-muted shrink-0">Plus</span>
                      <PrizeChips provider={provider} raw={r.bundle} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

const STEPS = [
  {
    n: '01',
    title: 'Swap through GSwap',
    body: 'Buy GRANDPA with ETH or sell it back, routed through Uniswap. A small fee on the ETH side goes into the prize pot.',
  },
  {
    n: '02',
    title: 'Earn entries',
    body: 'Entries grow with the square root of your ETH volume this round, so every swapper has a real shot. Buys earn full entries and sells earn half.',
  },
  {
    n: '03',
    title: 'Hold for a bonus',
    body: 'Holding 10K GRANDPA or more multiplies all your entries, rising to a 2x cap. It is read from your live balance at the draw.',
  },
  {
    n: '04',
    title: 'Win the pot',
    body: 'When the pot reaches its target, the swap that fills it draws a winner, who gets the ETH and any bonus tokens and NFTs on the spot. Then the next round begins.',
  },
];

const BONUS_LEVELS = [10_000n, 100_000n, 500_000n, 1_000_000n, 5_000_000n].map((whole) => {
  const balance = whole * 10n ** 18n;
  return { whole, bps: holderMultiplierBps(balance) };
});

export function HowItWorks({ data }: { data: Data }) {
  const { tax, protocol } = data;
  const fee = fmtBpsPct(protocol?.feeBps ?? GSWAP_CONFIG.fallbackFeeBps);
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading id="how-it-works" eyebrow="The rules of the club" title="How it works" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((s) => (
          <div key={s.n} className="gswap-card rounded-3xl p-5">
            <p className="gswap-title text-3xl gswap-gold-text">{s.n}</p>
            <h3 className="mt-3 text-lg font-extrabold">{s.title}</h3>
            <p className="mt-2 text-sm text-gs-muted leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="gswap-card rounded-3xl p-5 sm:p-6">
          <h3 className="text-lg font-extrabold">The 6% buy tax</h3>
          <p className="mt-2 text-sm text-gs-muted leading-relaxed">
            GRANDPA charges a {fmtBpsPct(tax.bps)} tax on every buy, which funds the Grandpa Strategy vault. GSwap shows the amount you
            receive after that tax, and your slippage limit protects the after-tax amount. You never need to add 6% to your slippage. Sells
            are not taxed.
          </p>
          <dl className="mt-4 text-sm divide-y divide-gs-line">
            <div className="flex justify-between py-2"><dt className="text-gs-muted">GSwap fee (to the pot)</dt><dd className="font-bold">{fee} of the ETH side</dd></div>
            <div className="flex justify-between py-2"><dt className="text-gs-muted">GRANDPA buy tax</dt><dd className="font-bold">{tax.enabled ? fmtBpsPct(tax.bps) : 'Off'}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-gs-muted">GRANDPA sell tax</dt><dd className="font-bold">None</dd></div>
          </dl>
        </div>

        <div className="gswap-card rounded-3xl p-5 sm:p-6">
          <h3 className="text-lg font-extrabold">Holder bonus levels</h3>
          <p className="mt-2 text-sm text-gs-muted leading-relaxed">
            Below {fmtToken(HOLDER_BONUS_FLOOR, { compact: true })} GRANDPA your entries count 1x. Above it the bonus climbs each time your
            balance doubles, up to the 2x cap.
          </p>
          <dl className="mt-4 text-sm divide-y divide-gs-line">
            {BONUS_LEVELS.map((l) => (
              <div key={String(l.whole)} className="flex justify-between py-2">
                <dt className="text-gs-muted">Hold {Number(l.whole).toLocaleString('en-US')}</dt>
                <dd className="font-bold text-gs-glint">{fmtMultiplier(l.bps)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <p className="mt-6 text-xs text-gs-muted leading-relaxed max-w-3xl">
        GSwap is an independent, permissionless contract. Swapping carries market risk. Only swap what you are comfortable with.
      </p>
    </section>
  );
}
