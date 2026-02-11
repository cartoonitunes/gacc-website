'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TokenStats, { type TokenData } from '@/components/grandpacoin/TokenStats';
import PriceDisplay, { GRANDPA_COIN_ADDRESS } from '@/components/grandpacoin/PriceDisplay';
import CountryClubGallery from '@/components/grandpacoin/CountryClubGallery';
import StoryCard from '@/components/grandpacoin/StoryCard';
import { ConnectWallet } from '@/components/shared/ConnectWallet';
import { Footer } from '@/components/layout/Footer';

const NAV_LINKS = [
  { href: '#about', label: 'ABOUT' },
  { href: '#tokenomics', label: 'TOKENOMICS' },
  { href: '#chart', label: 'CHART' },
  { href: '#buy-grandpacoin', label: 'BUY' },
  { href: '#country-club', label: 'COUNTRY CLUB' },
];

const SOCIALS = [
  { href: 'https://discord.gg/8uuhkZ2TA2', icon: 'fa-discord-alt', label: 'Discord' },
  { href: 'https://twitter.com/GrandpaApeCC', icon: 'fa-twitter', label: 'Twitter' },
  { href: 'https://www.instagram.com/grandpaapecountryclubofficial', icon: 'fa-instagram', label: 'Instagram' },
  { href: 'mailto:grandpaapecountryclub@gmail.com', icon: 'fa-envelope', label: 'Email' },
];

function GrandpaCoinNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-[#f9edcd] px-4 py-3">
      <div className="common-container flex items-center justify-between">
        <Link href="/">
          <Image
            src="/assets/images/GACC-Banner-Black-V6.png"
            alt="GACC logo"
            width={200}
            height={70}
            className="h-[50px] w-auto md:h-[70px]"
            priority
          />
        </Link>

        <button
          className="md:hidden p-2"
          style={{ color: 'black' }}
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{ color: 'black' }}
              className="font-medium text-sm hover:opacity-70 transition-opacity"
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-1">
            {SOCIALS.map((s) => (
              <a
                key={s.icon}
                href={s.href}
                target={s.href.startsWith('mailto') ? undefined : '_blank'}
                rel={s.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                aria-label={s.label}
                className="black-social-icon"
              >
                <i className={`fa ${s.icon}`} />
              </a>
            ))}
          </div>
          <ConnectWallet />
        </div>
      </div>

      {open && (
        <div className="md:hidden mt-3 flex flex-col gap-3 pb-3 common-container">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{ color: 'black' }}
              className="font-medium text-sm"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-1">
            {SOCIALS.map((s) => (
              <a
                key={s.icon}
                href={s.href}
                target={s.href.startsWith('mailto') ? undefined : '_blank'}
                rel={s.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                aria-label={s.label}
                className="black-social-icon"
              >
                <i className={`fa ${s.icon}`} />
              </a>
            ))}
          </div>
          <ConnectWallet />
        </div>
      )}
    </nav>
  );
}

export default function GrandpaCoinPage() {
  const [tokenData, setTokenData] = useState<TokenData>({
    totalSupply: null,
    totalBurned: null,
    vaultBalance: null,
    additionalWalletBalance: null,
    loading: true,
  });

  const ethAmount = '0.05';

  return (
    <div className="home-page min-h-screen">
      <GrandpaCoinNav />

      {/* Header */}
      <div className="text-center py-16 px-5">
        <Image
          src="/assets/images/grandpacoinlogo.jpg"
          alt="Grandpa Coin Logo"
          width={400}
          height={400}
          className="mx-auto mb-8 max-w-[400px] w-full h-auto"
          style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
        />
        <h1 style={{ color: 'black', fontSize: '3.5rem' }} className="font-bold mb-3">GRANDPA COIN</h1>
        <p style={{ color: 'black', fontSize: '1.5rem' }} className="italic">The Grandpa Strategy</p>
      </div>

      <div className="px-4 common-container">
        {/* About */}
        <div id="about" className="mb-10">
          <h2 className="common-title" style={{ color: 'black' }}>GRANDPA COIN</h2>
          <p className="common-p mt-3" style={{ color: 'black' }}>
            Grandpa Coin ($GRANDPA) is a strategy token that powers the Grandpa Ape Country Club ecosystem through an innovative buy-burn-lock strategy. With each purchase, 6% of the transaction goes directly to a Strategy Vault contract, where an autonomous bot continuously monitors the floor price of Grandpa NFTs and burns a percentage of $GRANDPA each time.
          </p>
          <p className="common-p mt-3" style={{ color: 'black' }}>
            The bot uses these accumulated funds to purchase floor Grandpa NFTs and automatically sends them to the Country Club contract, where they are enshrined eternally and cannot be removed. This creates perpetual buy pressure on the Grandpa Ape collection while rewarding holders through the deflationary nature of the token.
          </p>
          <p className="common-p mt-3" style={{ color: 'black' }}>
            Join the strategy. Hold Grandpa Coin. Support the Country Club.
          </p>
        </div>

        <hr className="gray-line mb-10" />

        {/* Tokenomics */}
        <div id="tokenomics" className="mb-10">
          <h2 className="common-title mb-4" style={{ color: 'black' }}>TOKEN INFORMATION</h2>
          <TokenStats onDataLoaded={setTokenData} />
        </div>

        <hr className="gray-line mb-10" />

        {/* Price */}
        <div className="mb-10">
          <h2 className="common-title mb-4" style={{ color: 'black' }}>MARKET DATA</h2>
          <PriceDisplay
            vaultBalance={tokenData.vaultBalance}
            additionalWalletBalance={tokenData.additionalWalletBalance}
          />
        </div>

        <hr className="gray-line mb-10" />

        {/* Chart */}
        <div id="chart" className="mb-10">
          <h2 className="common-title mb-4" style={{ color: 'black' }}>GRANDPA COIN CHART</h2>
          <div className="relative w-full" style={{ paddingBottom: '125%' }}>
            <iframe
              className="absolute inset-0 w-full h-full border-0"
              title="GeckoTerminal GRANDPA / WETH"
              src={`https://www.geckoterminal.com/eth/pools/0x21e6a491c887eb906846c212a280ad5e10ce0250?embed=1&info=0&swaps=0`}
              allow="clipboard-write"
              allowFullScreen
            />
          </div>
        </div>

        <hr className="gray-line mb-10" />

        {/* Buy */}
        <div id="buy-grandpacoin" className="mb-10">
          <div className="bg-white p-4 flex flex-col lg:flex-row items-center gap-4 rounded">
            <div className="lg:w-3/12">
              <h3 className="buy-ape-title" style={{ color: 'black' }}>BUY GRANDPA COIN</h3>
            </div>
            <div className="lg:w-4/12 lg:ml-4">
              <p style={{ color: 'black' }} className="text-sm">Swap ETH for $GRANDPA on Uniswap. Connect your wallet and complete the swap on Uniswap&apos;s secure interface.</p>
            </div>
            <div className="lg:w-2/12 lg:ml-auto">
              <a
                href={`https://app.uniswap.org/#/swap?exactField=input&exactAmount=${ethAmount}&inputCurrency=ETH&outputCurrency=${GRANDPA_COIN_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button
                  style={{ backgroundColor: '#83D8FC', color: 'black' }}
                  className="font-bold py-2 px-6 rounded w-full"
                  type="button"
                >
                  SWAP ON UNISWAP
                </button>
              </a>
            </div>
          </div>
        </div>

        <hr className="gray-line mb-10" />

        {/* Country Club */}
        <CountryClubGallery />

        <hr className="gray-line mb-10" />

        {/* Stories */}
        <Suspense fallback={null}>
          <StoryCard />
        </Suspense>
      </div>

      <Footer variant="light" />
    </div>
  );
}
