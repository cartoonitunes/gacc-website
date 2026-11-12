import Image from 'next/image';
import Link from 'next/link';
import { GSWAP_CONFIG } from '@/lib/gswap/config';

// Sits directly under GRANDPA STRATEGY on the homepage, styled like the site's white buy boxes.
export default function GSwapPromo() {
  const live = !!GSWAP_CONFIG.gswap;

  return (
    <section className="common-container px-4">
      <div className="mb-5 bg-white rounded p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex items-start md:items-center gap-4 md:w-8/12">
          <Image
            src="/assets/images/gswap/grandpa-640.jpg"
            alt=""
            width={72}
            height={72}
            className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-md shrink-0"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          />
          <div>
            <h3 className="buy-ape-title flex flex-wrap items-center gap-2" style={{ color: 'black' }}>
              GSWAP
              <span
                className="not-italic text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'black', color: '#d6ab67' }}
              >
                {live ? 'SWAP & WIN' : 'LAUNCHING SOON'}
              </span>
            </h3>
            <p className="text-sm mt-1" style={{ color: 'black' }}>
              The Country Club&apos;s own way to buy and sell $GRANDPA. Every swap earns raffle tickets, and when the
              pot fills, one swapper takes the ETH plus any token and NFT prizes in the round. Buys still send 6% to
              the Country Club, so every ticket helps lock up more Grandpa Apes.
            </p>
          </div>
        </div>
        <div className="md:w-3/12 md:ml-auto">
          <Link
            href="/gswap"
            className="bayc-button block w-full text-center"
            style={{ backgroundColor: '#d6ab67', color: 'black' }}
          >
            {live ? 'OPEN GSWAP' : 'PREVIEW GSWAP'}
          </Link>
        </div>
      </div>
    </section>
  );
}
