'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MemberData {
  member: {
    discordName: string;
    dailyStreak: number;
    perfectDailyMonths: number;
    isSupporter: boolean;
    createdAt: string;
  };
  gpBalance: number;
  recentActivity: {
    amount: number;
    eventType: string;
    assignedBy: string;
    data: any;
    createdAt: string;
  }[];
  redemptions: {
    amount: number;
    name: string;
    createdAt: string;
  }[];
  wallets: string[];
}

function truncateWallet(w: string) {
  return w.length > 10 ? `${w.slice(0, 6)}...${w.slice(-4)}` : w;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<MemberData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/dashboard/member')
        .then(r => r.json())
        .then(d => {
          if (d.error) setError(d.error);
          else setData(d);
        })
        .catch(() => setError('Failed to load dashboard'))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="text-white text-xl font-bold mb-2">Not Found</h2>
          <p className="text-gray-400">{error}</p>
          <Link href="/" className="mt-4 inline-block text-[#5865F2] hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { member, gpBalance, recentActivity, redemptions, wallets } = data;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {member.discordName}</h1>
            <p className="text-gray-400 mt-1">Member Dashboard</p>
          </div>
          <Link
            href="/dashboard/collection"
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            View Collection →
          </Link>
        </div>

        {/* GP Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-700/20 border border-yellow-800/50 rounded-xl p-5">
            <p className="text-yellow-400/70 text-xs uppercase tracking-wider mb-1">GP Balance</p>
            <p className="text-3xl font-bold text-yellow-300">{gpBalance.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Daily Streak</p>
            <p className="text-3xl font-bold">{member.dailyStreak} 🔥</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Perfect Months</p>
            <p className="text-3xl font-bold">{member.perfectDailyMonths} ⭐</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Member Since</p>
            <p className="text-lg font-bold">{formatDate(member.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500">No activity yet.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50">
                    <div>
                      <span className="text-sm text-gray-400">{formatDate(a.createdAt)}</span>
                      <span className="mx-2 text-gray-600">·</span>
                      <span className="text-sm text-gray-300">{a.eventType}</span>
                      {a.assignedBy && (
                        <span className="text-xs text-gray-500 ml-2">by {a.assignedBy}</span>
                      )}
                    </div>
                    <span className={`font-mono font-bold text-sm ${a.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {a.amount >= 0 ? '+' : ''}{a.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallets */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-lg font-bold mb-3">Enrolled Wallets</h2>
              {wallets.length === 0 ? (
                <p className="text-gray-500 text-sm">No wallets enrolled.</p>
              ) : (
                <div className="space-y-2">
                  {wallets.map((w, i) => (
                    <a
                      key={i}
                      href={`https://etherscan.io/address/${w}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {truncateWallet(w)}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Redemptions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-lg font-bold mb-3">Redemption History</h2>
              {redemptions.length === 0 ? (
                <p className="text-gray-500 text-sm">No redemptions yet.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {redemptions.map((r, i) => (
                    <div key={i} className="py-2 px-3 rounded-lg bg-gray-800/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white">{r.name}</span>
                        <span className="font-mono text-sm text-red-400">{r.amount} GP</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
