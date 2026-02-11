'use client';

import { useWallet } from '@/contexts/WalletContext';

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ConnectWallet() {
  const { account, isConnected, loading, connectWallet } = useWallet();

  return (
    <button
      onClick={connectWallet}
      disabled={loading}
      className="bg-[#83D8FC] text-black font-medium px-4 py-2 rounded text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
    >
      {loading ? 'Connecting...' : isConnected && account ? truncateAddress(account) : 'Connect Wallet'}
    </button>
  );
}
