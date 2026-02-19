import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Grandpa Ape Country Club',
    short_name: 'GACC',
    description:
      'A collection of 5,000 Grandpa Ape NFTs on the Ethereum blockchain. Your membership to the Country Club.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#1a1a2e',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
