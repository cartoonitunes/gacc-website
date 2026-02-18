import type { Metadata } from 'next';
import { WalletProvider } from '@/contexts/WalletContext';
import { SessionProvider } from '@/components/providers/SessionProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Grandpa Ape Country Club (GACC)',
  description:
    'The Grandpa Ape Country Club (GACC) is a collection of 5,000 unique Grandpa Ape NFTs, unique digital collectibles living on the Ethereum blockchain.',
  keywords:
    'GACC, MACC, NFT, blockchain, blockchain technology, non fungible tokens, nft art, nft crypto',
  openGraph: {
    title: 'Grandpa Ape Country Club',
    description:
      'A limited NFT collection where the token itself doubles as your membership to the country club. The club is open! Ape in with us.',
    images: [
      'https://lh3.googleusercontent.com/n9HKrkgouw_PsI79-XDrbfeomqcpVDXwDuJTKykWQjxVIOitQeDongPHwap1SbsFb_X0mVyoNGzztJPIV776N0kmnFkApZa-JBxyMA=s0',
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grandpa Ape Country Club',
    description:
      'A limited NFT collection where the token itself doubles as your membership to the country club. The club is open! Ape in with us.',
    images: [
      'https://lh3.googleusercontent.com/n9HKrkgouw_PsI79-XDrbfeomqcpVDXwDuJTKykWQjxVIOitQeDongPHwap1SbsFb_X0mVyoNGzztJPIV776N0kmnFkApZa-JBxyMA=s0',
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/fork-awesome@1.1.7/css/fork-awesome.min.css"
          integrity="sha256-gsmEoJAws/Kd3CjuOQzLie5Q3yshhvmo7YNtBG7aaEY="
          crossOrigin="anonymous"
        />
        <link rel="llms-txt" href="https://inlay.dev/api/llms/sa_698d357475ba9f6d640e2a69e1422a385d83aa53ea58a31f" />
        <link rel="mcp-manifest" type="application/json" href="https://inlay.dev/api/mcp/sa_698d357475ba9f6d640e2a69e1422a385d83aa53ea58a31f/manifest" />
        <script src="https://inlay.dev/api/script/s.js" data-key="sa_698d357475ba9f6d640e2a69e1422a385d83aa53ea58a31f" async></script>
      </head>
      <body>
        <SessionProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
