import type { Metadata, Viewport } from 'next';
import '@/styles/gswap.css';

const TITLE = 'GSwap | Swap GRANDPA, Win the Pot';
const DESCRIPTION =
  'Swap ETH and GrandpaCoin ($GRANDPA) through GSwap. Every swap feeds an ETH prize pot and earns raffle entries, with up to a 2x bonus for GRANDPA holders. By the Grandpa Ape Country Club.';
const OG_IMAGE = {
  url: '/assets/images/gswap/gswap-og.jpg',
  width: 1200,
  height: 630,
  alt: 'GSwap by Grandpa Ape Country Club: swap GRANDPA, win the pot',
};

// Served at /gswap and, through a rewrite in next.config.mjs, at /swap.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'GSwap, GrandpaCoin, GRANDPA, GACC, Grandpa Ape Country Club, swap, raffle, Uniswap, Ethereum',
  alternates: { canonical: '/gswap' },
  openGraph: {
    type: 'website',
    url: '/gswap',
    siteName: 'Grandpa Ape Country Club',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@GrandpaApeCC',
    creator: '@GrandpaApeCC',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: '#0f0c08',
};

export default function GSwapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
