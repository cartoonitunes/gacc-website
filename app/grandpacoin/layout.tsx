import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GrandpaCoin ($GRANDPA) | GACC',
  description:
    'GrandpaCoin is the official ERC-20 token of the Grandpa Ape Country Club ecosystem on Ethereum.',
  openGraph: {
    title: 'GrandpaCoin ($GRANDPA)',
    description:
      'The official ERC-20 token of the Grandpa Ape Country Club ecosystem. View tokenomics, chart, and buy $GRANDPA.',
    images: ['/assets/images/grandpacoinlogo.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GrandpaCoin ($GRANDPA)',
    description:
      'The official ERC-20 token of the Grandpa Ape Country Club ecosystem. View tokenomics, chart, and buy $GRANDPA.',
    images: ['/assets/images/grandpacoinlogo.jpg'],
  },
};

export default function GrandpaCoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
