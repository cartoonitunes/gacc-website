'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import TokenStats, { type TokenData } from '@/components/grandpacoin/TokenStats';
import PriceDisplay from '@/components/grandpacoin/PriceDisplay';
import CountryClubGallery from '@/components/grandpacoin/CountryClubGallery';
import StoryCard from '@/components/grandpacoin/StoryCard';

export default function GrandpaCoinPage() {
  const [tokenData, setTokenData] = useState<TokenData>({
    totalSupply: null,
    totalBurned: null,
    vaultBalance: null,
    additionalWalletBalance: null,
    loading: true,
  });

  return (
    <div className="bg-[#f9edcd] min-h-screen">
      <div className="text-center py-16 px-5">
        <Image
          src="/assets/images/grandpacoinlogo.jpg"
          alt="Grandpa Coin Logo"
          width={400}
          height={400}
          className="mx-auto mb-8 shadow-xl max-w-[400px] w-full h-auto"
        />
        <h1 className="text-black text-4xl lg:text-5xl font-bold mb-3">GRANDPA COIN</h1>
        <p className="text-black text-xl italic">The Grandpa Strategy</p>
      </div>

      <div className="px-4 max-w-7xl mx-auto">
        <div id="about" className="mb-10">
          <h2 className="text-2xl font-bold text-black mb-3">GRANDPA COIN</h2>
          <p className="text-black text-base leading-relaxed">
            Grandpa Coin ($GRANDPA) is a strategy token that powers the Grandpa Ape Country Club ecosystem through an innovative buy-burn-lock strategy. With each purchase, 6% of the transaction goes directly to a Strategy Vault contract, where an autonomous bot continuously monitors the floor price of Grandpa NFTs and burns a percentage of $GRANDPA each time.
          </p>
          <p className="text-black text-base leading-relaxed mt-3">
            The bot uses these accumulated funds to purchase floor Grandpa NFTs and automatically sends them to the Country Club contract, where they are enshrined eternally and cannot be removed. This creates perpetual buy pressure on the Grandpa Ape collection while rewarding holders through the deflationary nature of the token.
          </p>
          <p className="text-black text-base leading-relaxed mt-3">
            Join the strategy. Hold Grandpa Coin. Support the Country Club.
          </p>
        </div>

        <hr className="border-gray-300 mb-10" />

        <div id="tokenomics" className="mb-10">
          <h2 className="text-2xl font-bold text-black mb-4">TOKEN INFORMATION</h2>
          <TokenStats onDataLoaded={setTokenData} />
        </div>

        <hr className="border-gray-300 mb-10" />

        <PriceDisplay
          vaultBalance={tokenData.vaultBalance}
          additionalWalletBalance={tokenData.additionalWalletBalance}
        />

        <hr className="border-gray-300 mb-10" />

        <CountryClubGallery />
      </div>

      <Suspense fallback={null}>
        <StoryCard nftMetadata={{}} />
      </Suspense>
    </div>
  );
}
