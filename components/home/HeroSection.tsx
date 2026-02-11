'use client';

import Image from 'next/image';

export default function HeroSection() {
  return (
    <section>
      <div className="mb-8 lg:mb-10">
        <Image
          src="/assets/images/GACC_COVER-2.png"
          alt="GACC Cover"
          width={1920}
          height={600}
          className="w-full h-auto"
          priority
        />
      </div>

      <div className="px-4 mt-4 lg:mt-8">
        <div className="mb-10 flex flex-col lg:flex-row gap-6">
          <div className="lg:w-7/12">
            <h1 className="font-italic text-black text-3xl lg:text-4xl font-bold mb-3">
              WELCOME TO THE<br />GRANDPA APE COUNTRY CLUB
            </h1>
            <p className="text-black text-base leading-relaxed">
              Grandpa Ape Country Club (&quot;GACC&quot;) is a collection of 5,000 Grandpa Ape NFTs, unique digital collectibles living on the Ethereum blockchain. Your Grandpa Ape doubles as your Country Club membership card, and grants access to members-only benefits, including airdrops and exclusive mints, in-person and virtual events, never ending games, and more. The GACC community is global and diverse, representing NFT investors of all shapes and forms. We welcome everyone to join us on this adventure!
            </p>
          </div>
          <div className="lg:w-5/12 lg:ml-auto my-auto">
            <div className="grid grid-cols-2 gap-2">
              <Image src="/assets/images/Ape_1-scaled.jpg" alt="ape1" width={250} height={250} className="rounded-md w-full" />
              <Image src="/assets/images/Ape_4-scaled.jpg" alt="ape2" width={250} height={250} className="rounded-md w-full" />
              <Image src="/assets/images/Ape_6-scaled.jpg" alt="ape3" width={250} height={250} className="rounded-md w-full" />
              <Image src="/assets/images/Ape_2-scaled.jpg" alt="ape4" width={250} height={250} className="rounded-md w-full" />
            </div>
          </div>
        </div>

        <div id="buy-a-gacc" className="mb-10">
          <div className="bg-white p-4 flex flex-col lg:flex-row items-center gap-4 rounded">
            <div className="lg:w-3/12">
              <h3 className="text-xl font-bold text-black">BUY A GACC</h3>
            </div>
            <div className="lg:w-4/12 lg:ml-4">
              <p className="text-black text-sm">The initial sale has sold out. To get your Grandpa Ape, check out the collection on OpenSea, or any other major NFT marketplace.</p>
            </div>
            <div className="lg:w-2/12 lg:ml-auto">
              <a href="https://opensea.io/collection/grandpaapecountryclub" target="_blank" rel="noopener noreferrer">
                <button className="bg-[#83D8FC] text-black font-bold py-2 px-6 rounded w-full" type="button">
                  VISIT OPENSEA
                </button>
              </a>
            </div>
          </div>
        </div>

        <hr className="border-gray-300 mb-10" />

        <div className="mb-10 flex flex-col lg:flex-row gap-6">
          <div className="lg:w-7/12">
            <h2 className="text-2xl font-bold text-black mb-3">THE SPECS</h2>
            <p className="text-black text-base leading-relaxed">
              Each Grandpa Ape is unique and programmatically generated from over 200 possible traits, including expression, headwear, clothing, and more. All apes are spiffy, but some are rarer than others.
            </p>
            <p className="text-black text-base leading-relaxed mt-4">
              The apes are stored as ERC-721 tokens on the Ethereum blockchain and hosted on IPFS.
            </p>
          </div>
        </div>

        <hr className="border-gray-300 mb-10" />

        <div className="mb-10 flex flex-col lg:flex-row gap-6">
          <div className="lg:w-7/12">
            <h2 className="text-2xl font-bold text-black mb-3">GRANDPA STRATEGY</h2>
            <p className="text-black text-base leading-relaxed">
              Grandpa Coin ($GRANDPA) is a strategy token that powers the Grandpa Ape Country Club ecosystem through an innovative buy-burn-lock strategy. With each purchase, 6% of the transaction goes directly to a Strategy Vault contract, where an autonomous bot continuously monitors the floor price of Grandpa NFTs and burns a percentage of $GRANDPA each time.
            </p>
            <p className="text-black text-base leading-relaxed mt-4">
              This creates a perpetual buy pressure mechanism that strengthens the Grandpa Ape collection while rewarding holders through the deflationary nature of the token.
            </p>
          </div>
          <div className="lg:w-3/12 lg:ml-auto my-auto">
            <a href="/grandpacoin">
              <button className="bg-[#83D8FC] text-black font-bold py-2 px-6 rounded w-full" type="button">
                GRANDPA COIN
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
