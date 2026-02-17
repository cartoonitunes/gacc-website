'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface NFT {
  tokenId: string;
  name: string;
  image: string | null;
}

interface Collection {
  gacc: NFT[];
  macc: NFT[];
  kittens: NFT[];
}

function NFTGrid({ title, nfts, emptyMsg }: { title: string; nfts: NFT[]; emptyMsg: string }) {
  if (nfts.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">{title} <span className="text-gray-500 text-sm font-normal">(0)</span></h2>
        <p className="text-gray-500">{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">{title} <span className="text-gray-500 text-sm font-normal">({nfts.length})</span></h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {nfts.map((nft) => (
          <div key={nft.tokenId} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
            <div className="aspect-square relative bg-gray-800">
              {nft.image ? (
                <Image
                  src={nft.image}
                  alt={nft.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">?</div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium truncate">{nft.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const { status } = useSession();
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/dashboard/collection')
        .then(r => r.json())
        .then(d => {
          if (d.error) setError(d.error);
          else setCollection(d);
        })
        .catch(() => setError('Failed to load collection'))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Loading your collection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md text-center">
          <p className="text-red-400">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-[#5865F2] hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!collection) return null;

  const total = collection.gacc.length + collection.macc.length + collection.kittens.length;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Collection</h1>
            <p className="text-gray-400 mt-1">{total} NFT{total !== 1 ? 's' : ''} across enrolled wallets</p>
          </div>
          <Link
            href="/dashboard"
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        <NFTGrid title="Grandpa Apes (GACC)" nfts={collection.gacc} emptyMsg="No GACC NFTs found in enrolled wallets." />
        <NFTGrid title="Mutant Apes (MACC)" nfts={collection.macc} emptyMsg="No MACC NFTs found in enrolled wallets." />
        <NFTGrid title="Kittens (GAKC)" nfts={collection.kittens} emptyMsg="No Kitten NFTs found in enrolled wallets." />
      </div>
    </div>
  );
}
