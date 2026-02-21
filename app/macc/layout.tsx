import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { maccCollectionJsonLd } from '@/components/seo/structured-data';

export const metadata: Metadata = {
  title: 'Mutant Ape Country Club (MACC) | GACC',
  description:
    'The MACC is a collection of up to 10,000 Mutant Ape NFTs created by exposing Grandpa Apes to mutant serum or minting in the public sale.',
  openGraph: {
    title: 'Mutant Ape Country Club (MACC)',
    description:
      'Up to 10,000 Mutant Ape NFTs — mutate your Grandpa Ape with serum or mint a Mutant directly.',
    images: ['/assets/images/MACC_COVER.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mutant Ape Country Club (MACC)',
    description:
      'Up to 10,000 Mutant Ape NFTs — mutate your Grandpa Ape with serum or mint a Mutant directly.',
    images: ['/assets/images/MACC_COVER.png'],
  },
};

export default function MACCLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={maccCollectionJsonLd} />
      {children}
    </>
  );
}
