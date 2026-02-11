'use client';

import Image from 'next/image';

export default function GallerySection() {
  return (
    <section className="common-container px-4">
      <div className="mb-5 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-8/12">
          <h2 className="common-title" style={{ color: 'black' }}>THE GREENS</h2>
          <p className="common-p" style={{ color: 'black' }}>
            The Greens is the main Discord channel, where the community voice lives and breathes. In the Discord is where we collaborate, earn Grandpa Points (&quot;GP&quot;) for games and prizes, share our love for the NFT art, and hang out with friends. Join us anytime! New members get 250 GP just for joining!
          </p>
        </div>
        <div className="lg:w-3/12 lg:ml-auto my-auto">
          <a href="https://discord.gg/8uuhkZ2TA2">
            <button className="bayc-button w-full" style={{ backgroundColor: '#83D8FC', color: 'black' }} type="button">DISCORD</button>
          </a>
        </div>
      </div>

      <hr className="gray-line mb-5" />

      <div className="mb-5 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-8/12">
          <h2 className="common-title" style={{ color: 'black' }} id="merch">GACC PRO SHOP (MERCH)</h2>
          <p className="common-p" style={{ color: 'black' }}>
            The GACC NFT ecosystem brand looks incredible on merchandise. The GACC Pro Shop is always open but keep an eye out for weekly one-of-a-kind merch drops only available for a short period.
          </p>
        </div>
        <div className="lg:w-3/12 lg:ml-auto my-auto">
          <a href="https://gaccproshop.com/">
            <button className="bayc-button w-full" style={{ backgroundColor: '#83D8FC', color: 'black' }} type="button">GACC PRO SHOP</button>
          </a>
        </div>
      </div>

      <hr className="gray-line mb-5" />

      <div className="mb-5 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-8/12">
          <h2 className="common-title" style={{ color: 'black' }}>GACC LOUNGE ALPHA BOT</h2>
          <p className="common-p" style={{ color: 'black' }}>
            GACC holders with five or more grandpas get access to an exclusive Discord channel with a bot that pulls down and analyzes code from any ERC271 and ERC1155 contract. The bot allows holders to gain deep insights into an NFT contract before investing at the touch of a button.
          </p>
        </div>
        <div className="lg:w-3/12 lg:ml-auto my-auto">
          <Image
            src="/assets/images/lightspeed_gacc_2561.gif"
            alt="robot"
            width={300}
            height={300}
            className="rounded-md w-full"
            unoptimized
          />
        </div>
      </div>
    </section>
  );
}
