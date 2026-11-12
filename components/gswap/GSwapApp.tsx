'use client';

import { useWallet } from '@/contexts/WalletContext';
import { Footer } from '@/components/layout/Footer';
import { useGSwapData } from './useGSwapData';
import { GSwapNav } from './GSwapNav';
import { SwapCard } from './SwapCard';
import { Hero, HowItWorks, PastWinners, RoundPanel, YourStats } from './Sections';

export default function GSwapApp() {
  const { account } = useWallet();
  const data = useGSwapData(account);

  return (
    <div className="gswap">
      <GSwapNav />
      {data.networkError && (
        <div className="bg-gs-bad/15 border-b border-gs-bad/30 text-center text-sm text-[#f2a796] px-4 py-2" role="alert">
          Having trouble reaching Ethereum. Showing the last known data and retrying.{' '}
          <button onClick={() => data.refresh()} className="font-bold underline underline-offset-2">
            Retry now
          </button>
        </div>
      )}
      <main>
        <Hero data={data}>
          <SwapCard data={data} />
        </Hero>
        <div className="border-t border-gs-line/60" />
        <RoundPanel data={data} />
        <YourStats data={data} />
        <PastWinners data={data} />
        <HowItWorks data={data} />
      </main>
      <Footer variant="dark" />
    </div>
  );
}
