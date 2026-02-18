import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grandpa Ape Kitten Club (GAKC) | GACC',
  description:
    'The GAKC is a collection of unique Kitten NFTs in the Grandpa Ape Country Club ecosystem on Ethereum.',
  openGraph: {
    title: 'Grandpa Ape Kitten Club (GAKC)',
    description:
      'Unique Kitten NFTs in the Grandpa Ape Country Club ecosystem. Mint, breed, and explore the GAKC.',
    images: ['/assets/images/gakc_banner_white.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grandpa Ape Kitten Club (GAKC)',
    description:
      'Unique Kitten NFTs in the Grandpa Ape Country Club ecosystem. Mint, breed, and explore the GAKC.',
    images: ['/assets/images/gakc_banner_white.png'],
  },
};

export default function KittenClubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
