import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NotFoundRedirect } from '@/components/layout/NotFoundRedirect';

export const metadata: Metadata = {
  title: '404 — Page Not Found | GACC',
  description: 'This page doesn\'t exist in the Grandpa Ape Country Club.',
};

export default function NotFound() {
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
            className="text-6xl font-bold mb-4"
            style={{ color: '#333', fontFamily: 'inherit' }}
          >
            404
          </h1>
          <p
            className="text-xl mb-2"
            style={{ color: '#555' }}
          >
            This Grandpa wandered off the golf course.
          </p>
          <p
            className="text-base mb-8"
            style={{ color: '#777' }}
          >
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <NotFoundRedirect />
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg text-white font-semibold transition-colors"
              style={{ backgroundColor: '#333' }}
            >
              Back to Country Club
            </Link>
            <Link
              href="/grandpacoin"
              className="inline-block px-6 py-3 rounded-lg font-semibold border-2 transition-colors"
              style={{ borderColor: '#333', color: '#333' }}
            >
              View GrandpaCoin
            </Link>
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  );
}
