'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5f5' }}>
      <Navbar variant="light" />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-lg">
          <Image
            src="/assets/images/GACC-Banner-Black-V6.png"
            alt="GACC"
            width={200}
            height={70}
            className="h-[50px] w-auto mx-auto mb-8"
          />
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: '#333' }}
          >
            Something went wrong
          </h1>
          <p
            className="text-base mb-8"
            style={{ color: '#777' }}
          >
            Don&apos;t worry, even Grandpa drops his golf ball sometimes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-block px-6 py-3 rounded-lg text-white font-semibold transition-colors cursor-pointer"
              style={{ backgroundColor: '#333' }}
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg font-semibold border-2 transition-colors"
              style={{ borderColor: '#333', color: '#333' }}
            >
              Back to Country Club
            </Link>
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  );
}
