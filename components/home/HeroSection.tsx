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

      <div className="common-container px-4 mt-4 lg:mt-8">
        <div className="mb-5 flex flex-col lg:flex-row gap-6">
          <div className="lg:w-7/12">
            <h1 className="common-title" style={{ color: 'black' }}>
              WELCOME TO THE<br />GRANDPA APE COUNTRY CLUB
            </h1>
            <p className="common-p" style={{ color: 'black' }}>
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

        <div id="buy-a-gacc" className="mb-5">
          <div className="bg-white buy-token-container p-4 flex flex-col lg:flex-row items-center gap-4 rounded">
            <div className="lg:w-3/12">
              <h3 className="buy-ape-title" style={{ color: 'black' }}>BUY A GACC</h3>
            </div>
            <div className="lg:w-4/12 lg:ml-4">
              <p className="common-p" style={{ color: 'black' }}>The initial sale has sold out. To get your Grandpa Ape, check out the collection on OpenSea, or any other major NFT marketplace.</p>
            </div>
            <div className="lg:w-2/12 lg:ml-auto">
              <a href="https://opensea.io/collection/grandpaapecountryclub" target="_blank" rel="noopener noreferrer">
                <button className="bayc-button w-full" style={{ backgroundColor: '#83D8FC', color: 'black' }} type="button">
                  VISIT OPENSEA
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
