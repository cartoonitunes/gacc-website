'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

export function UserNav() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
        className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <i className="fa fa-discord-alt" />
        Login
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt="Avatar"
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <span className="text-sm font-medium hidden sm:inline">
          {session.user?.name}
        </span>
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
