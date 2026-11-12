'use client';

import { useEffect, useState } from 'react';
import { Contract, formatUnits, parseEther, parseUnits, type JsonRpcProvider } from 'ethers';
import { GSWAP_CONFIG } from '@/lib/gswap/config';
import { ERC20_ADMIN_ABI, ERC721_ADMIN_ABI, ERC721_INTERFACE_ID, parseAddressInput } from '@/lib/gswap/admin';
import { resolveNftPrizes, type NftPrize } from '@/lib/gswap/prizes';
import { fmtEth, shortAddr } from '@/lib/gswap/format';
import { sanitizeAmountInput } from '@/lib/gswap/math';
import { Notice, Skeleton } from '../ui';
import { ActionButton, Field, StatusLine, SubCard } from './parts';
import { useAdminAction, type AdminState, type TxStep } from './useAdmin';

interface Props {
  admin: AdminState;
  account: string;
  provider: JsonRpcProvider;
  onChanged: () => void;
}

/** Optional target round: blank means the current round; otherwise it must be the current round or later. */
function useRoundInput(currentRound: number) {
  const [text, setText] = useState('');
  const n = text === '' ? null : Number(text);
  const error = n !== null && (!Number.isInteger(n) || n < currentRound) ? `Use round ${currentRound} or later.` : null;
  const field = (
    <Field
      label="Round (optional)"
      placeholder={`Current (#${currentRound})`}
      inputMode="numeric"
      value={text}
      error={error}
      onChange={(e) => /^\d*$/.test(e.target.value) && setText(e.target.value)}
    />
  );
  // addPrize/addNFTPrize target the current round; the ...ForRound variants take an explicit one.
  const round = n === null || n === currentRound ? null : n;
  return { field, round, error, reset: () => setText('') };
}

// ---------------------------------------------------------------------------

function BoostControl({ admin, account, provider, onChanged }: Props) {
  const { status, run, reset, busy } = useAdminAction(account, onChanged);
  const [text, setText] = useState('');
  const [balance, setBalance] = useState<bigint | null>(null);
  useEffect(() => {
    provider.getBalance(account).then(setBalance).catch(() => setBalance(null));
  }, [provider, account, status.kind]);

  let wei: bigint | null = null;
  try {
    wei = text && Number(text) > 0 ? parseEther(text) : null;
  } catch {
    wei = null;
  }
  const short = wei !== null && balance !== null && wei > balance;

  return (
    <SubCard title="Add ETH to the prize" hint={`Tops up round #${admin.currentRound}'s ETH prize. It goes to the winner but does not count toward the draw threshold.`}>
      <Field
        label="Amount"
        inputMode="decimal"
        placeholder="0.0"
        value={text}
        suffix="ETH"
        error={short ? 'More than your wallet balance.' : null}
        note={balance !== null ? `Balance ${fmtEth(balance, 4)}` : undefined}
        onChange={(e) => {
          const v = sanitizeAmountInput(e.target.value, 18);
          if (v !== null) setText(v);
        }}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <ActionButton
          disabled={busy || wei === null || short}
          onClick={async () => {
            if (wei === null) return;
            const ok = await run([{ label: 'Boosting prize', send: (c) => ({ fn: c.gswap.boostPrize, args: [], overrides: { value: wei } }) }], `Added ${fmtEth(wei, 4)} to the prize.`);
            if (ok) setText('');
          }}
        >
          Boost prize
        </ActionButton>
        <StatusLine status={status} onDismiss={reset} />
      </div>
    </SubCard>
  );
}

// ---------------------------------------------------------------------------

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  allowance: bigint;
}

function TokenPrizeControl({ admin, account, provider, onChanged }: Props) {
  const gswapAddr = GSWAP_CONFIG.gswap!;
  const { status, run, reset, busy } = useAdminAction(account, onChanged);
  const [addrText, setAddrText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [shortfall, setShortfall] = useState<string | null>(null);
  const round = useRoundInput(admin.currentRound);

  const address = parseAddressInput(addrText);
  useEffect(() => {
    setInfo(null);
    setInfoError(null);
    if (!address) return;
    let cancelled = false;
    (async () => {
      try {
        if ((await provider.getCode(address)) === '0x') throw new Error('No contract at this address.');
        const t = new Contract(address, ERC20_ADMIN_ABI as any, provider);
        const [symbol, decimals, balance, allowance] = await Promise.all([t.symbol(), t.decimals(), t.balanceOf(account), t.allowance(account, gswapAddr)]);
        if (!cancelled) setInfo({ address, symbol, decimals: Number(decimals), balance, allowance });
      } catch (err: any) {
        if (!cancelled) setInfoError(err?.message === 'No contract at this address.' ? err.message : 'This does not look like an ERC-20 token.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, provider, account, gswapAddr, status.kind]);

  let amount: bigint | null = null;
  try {
    amount = info && amountText && Number(amountText) > 0 ? parseUnits(amountText, info.decimals) : null;
  } catch {
    amount = null;
  }
  const short = info && amount !== null && amount > info.balance;
  const needsApproval = info && amount !== null && info.allowance < amount;

  const submit = async () => {
    if (!info || amount === null) return;
    setShortfall(null);
    const token = new Contract(info.address, ERC20_ADMIN_ABI as any, provider);
    const before: bigint = await token.balanceOf(gswapAddr);
    const steps: TxStep[] = [];
    if (needsApproval) {
      // Approve exactly this prize, never an open-ended allowance.
      steps.push({ label: `Approving ${info.symbol}`, send: (c) => ({ fn: c.at(info.address, ERC20_ADMIN_ABI).approve, args: [gswapAddr, amount] }) });
    }
    const target = round.round;
    steps.push({
      label: 'Adding token prize',
      send: (c) =>
        target === null ? { fn: c.gswap.addPrize, args: [info.address, amount] } : { fn: c.gswap.addPrizeForRound, args: [info.address, amount, BigInt(target)] },
    });
    const ok = await run(steps, `Added ${amountText} ${info.symbol} to round #${target ?? admin.currentRound}.`);
    if (!ok) return;
    // GSwap records the amount sent, so a token that skims a fee on transfer would leave the prize short
    // and its payout would fail. Check what actually arrived.
    const received = (await token.balanceOf(gswapAddr)) - before;
    if (received < amount) {
      setShortfall(
        `GSwap only received ${formatUnits(received, info.decimals)} ${info.symbol} of ${amountText}. This token takes a fee on transfer, so this prize may not pay out. Consider topping up GSwap with the difference.`
      );
    }
    setAmountText('');
    round.reset();
  };

  return (
    <SubCard title="Add a token prize" hint="Any ERC-20. It is moved from your wallet into GSwap and paid to the round's winner with the ETH.">
      <Field label="Token contract" placeholder="0x..." value={addrText} error={addrText && !address ? 'Not a valid address.' : infoError} onChange={(e) => setAddrText(e.target.value)} />
      {address && !info && !infoError && <Skeleton className="h-4 w-40" />}
      {info && (
        <>
          <Field
            label={`Amount of ${info.symbol}`}
            inputMode="decimal"
            placeholder="0"
            value={amountText}
            suffix={info.symbol}
            error={short ? 'More than your balance.' : null}
            note={`Balance ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(Number(formatUnits(info.balance, info.decimals)))} ${info.symbol}`}
            onChange={(e) => {
              const v = sanitizeAmountInput(e.target.value, info.decimals);
              if (v !== null) setAmountText(v);
            }}
          />
          {round.field}
          {needsApproval && !short && <p className="text-xs text-gs-muted">Two transactions: approve exactly this amount of {info.symbol}, then add the prize.</p>}
        </>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <ActionButton disabled={busy || !info || amount === null || !!short || !!round.error} onClick={submit}>
          {needsApproval ? 'Approve and add prize' : 'Add prize'}
        </ActionButton>
        <StatusLine status={status} onDismiss={reset} />
      </div>
      {shortfall && <Notice tone="warn">{shortfall}</Notice>}
    </SubCard>
  );
}

// ---------------------------------------------------------------------------

interface NftCheck {
  owner: string | null;
  approved: boolean;
  isErc721: boolean;
}

function NftPrizeControl({ admin, account, provider, onChanged }: Props) {
  const gswapAddr = GSWAP_CONFIG.gswap!;
  const { status, run, reset, busy } = useAdminAction(account, onChanged);
  const [addrText, setAddrText] = useState('');
  const [idText, setIdText] = useState('');
  const [preview, setPreview] = useState<NftPrize | null>(null);
  const [check, setCheck] = useState<NftCheck | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const round = useRoundInput(admin.currentRound);

  const address = parseAddressInput(addrText);
  const tokenId = /^\d+$/.test(idText) ? idText : null;

  useEffect(() => {
    setPreview(null);
    setCheck(null);
    setLookupError(null);
    setImgFailed(false);
    if (!address || tokenId === null) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        if ((await provider.getCode(address)) === '0x') throw new Error('No contract at this address.');
        const nft = new Contract(address, ERC721_ADMIN_ABI as any, provider);
        const [isErc721, owner, approvedTo, forAll] = await Promise.all([
          (nft.supportsInterface(ERC721_INTERFACE_ID) as Promise<boolean>).catch(() => false),
          (nft.ownerOf(tokenId) as Promise<string>).catch(() => null),
          (nft.getApproved(tokenId) as Promise<string>).catch(() => null),
          (nft.isApprovedForAll(account, gswapAddr) as Promise<boolean>).catch(() => false),
        ]);
        if (cancelled) return;
        setCheck({ owner, isErc721, approved: forAll || (approvedTo !== null && approvedTo.toLowerCase() === gswapAddr.toLowerCase()) });
        const [p] = await resolveNftPrizes(provider, [{ address, tokenId }]);
        if (!cancelled) setPreview(p);
      } catch (err: any) {
        if (!cancelled) setLookupError(err?.message === 'No contract at this address.' ? err.message : 'Could not read this NFT.');
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [address, tokenId, provider, account, gswapAddr, status.kind]);

  const notOwner = check && check.owner !== null && check.owner.toLowerCase() !== account.toLowerCase();
  const missing = check && check.owner === null;
  const ready = !!check && !notOwner && !missing && !round.error;

  const submit = async () => {
    if (!address || tokenId === null || !check) return;
    const steps: TxStep[] = [];
    if (!check.approved) {
      // Approve this one token only, not the whole collection.
      steps.push({ label: 'Approving NFT', send: (c) => ({ fn: c.at(address, ERC721_ADMIN_ABI).approve, args: [gswapAddr, BigInt(tokenId)] }) });
    }
    const target = round.round;
    steps.push({
      label: 'Adding NFT prize',
      send: (c) =>
        target === null
          ? { fn: c.gswap.addNFTPrize, args: [address, BigInt(tokenId)] }
          : { fn: c.gswap.addNFTPrizeForRound, args: [address, BigInt(tokenId), BigInt(target)] },
    });
    const ok = await run(steps, `Added ${preview?.name ?? `#${tokenId}`} to round #${target ?? admin.currentRound}.`);
    if (ok) {
      setIdText('');
      round.reset();
    }
  };

  const title = preview?.name ?? (preview?.collection ? `${preview.collection} #${tokenId}` : tokenId ? `#${tokenId}` : '');

  return (
    <SubCard title="Add an NFT prize" hint="Any ERC-721 you own. It is moved into GSwap and goes to the round's winner.">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
        <Field label="NFT contract" placeholder="0x..." value={addrText} error={addrText && !address ? 'Not a valid address.' : lookupError} onChange={(e) => setAddrText(e.target.value)} />
        <Field label="Token ID" placeholder="1234" inputMode="numeric" value={idText} onChange={(e) => /^\d*$/.test(e.target.value) && setIdText(e.target.value)} />
      </div>

      {address && tokenId !== null && !lookupError && (
        <div className="flex items-center gap-3 rounded-xl ring-1 ring-gs-line bg-gs-ink/60 p-2.5">
          <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gs-raised">
            {!check ? (
              <Skeleton className="w-full h-full !rounded-none" />
            ) : preview?.image && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.image} alt={title} className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
            ) : preview ? (
              <span className="w-full h-full flex items-center justify-center text-2xl" aria-hidden="true">🖼️</span>
            ) : (
              <Skeleton className="w-full h-full !rounded-none" />
            )}
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-extrabold truncate">{title || <Skeleton className="h-4 w-32" />}</p>
            {preview?.collection && <p className="text-xs text-gs-muted truncate">{preview.collection}</p>}
            {check && (
              <p className={`mt-1 text-xs ${notOwner || missing ? 'text-gs-bad' : 'text-gs-good'}`}>
                {missing
                  ? 'This token does not exist.'
                  : notOwner
                    ? `Owned by ${shortAddr(check.owner!)}, not your wallet.`
                    : check.approved
                      ? 'You own this. Ready to add.'
                      : 'You own this. It needs a one-time approval first.'}
              </p>
            )}
            {check && !check.isErc721 && !missing && <p className="text-xs text-[#f3c98b]">This contract does not report ERC-721 support. Double-check it.</p>}
          </div>
        </div>
      )}

      {check && ready && round.field}

      <div className="flex items-center gap-3 flex-wrap">
        <ActionButton disabled={busy || !ready} onClick={submit}>
          {check && !check.approved ? 'Approve and add NFT' : 'Add NFT'}
        </ActionButton>
        <StatusLine status={status} onDismiss={reset} />
      </div>
    </SubCard>
  );
}

// ---------------------------------------------------------------------------

export function PrizeControls(props: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <BoostControl {...props} />
      <TokenPrizeControl {...props} />
      <NftPrizeControl {...props} />
    </div>
  );
}
