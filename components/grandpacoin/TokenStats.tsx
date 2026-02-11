'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contract, formatEther, JsonRpcProvider } from 'ethers';

const GRANDPA_COIN_ADDRESS = '0x20BFd82E6AD6A39cf4bD1F803e662FC065cD3d5F';
const STRATEGY_VAULT_ADDRESS = '0xDE82675759071131a21Ef97086B90410Bc68c96d';
const ADDITIONAL_WALLET_ADDRESS = '0x4965599764a4C48C4f209Ca1eE36d8AA4530a551';
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

const ERC20_ABI = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address _owner) view returns (uint256)',
];

function getReadProvider() {
  return new JsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  );
}

function formatNumber(num: string | number | null, decimals = 2): string {
  if (!num) return '0';
  return parseFloat(String(num)).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

export interface TokenData {
  totalSupply: string | null;
  totalBurned: string | null;
  vaultBalance: string | null;
  additionalWalletBalance: string | null;
  loading: boolean;
}

export default function TokenStats({ onDataLoaded }: { onDataLoaded?: (data: TokenData) => void }) {
  const [totalSupply, setTotalSupply] = useState<string | null>(null);
  const [totalBurned, setTotalBurned] = useState<string | null>(null);
  const [vaultBalance, setVaultBalance] = useState<string | null>(null);
  const [additionalWalletBalance, setAdditionalWalletBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadContractData = useCallback(async () => {
    try {
      const provider = getReadProvider();
      const grandpaContract = new Contract(GRANDPA_COIN_ADDRESS, ERC20_ABI, provider);

      const [supply, vaultBal, additionalBal, deadBal] = await Promise.all([
        grandpaContract.totalSupply(),
        grandpaContract.balanceOf(STRATEGY_VAULT_ADDRESS),
        grandpaContract.balanceOf(ADDITIONAL_WALLET_ADDRESS),
        grandpaContract.balanceOf(DEAD_ADDRESS),
      ]);

      const supplyStr = formatEther(supply);
      const vaultStr = formatEther(vaultBal);
      const additionalStr = formatEther(additionalBal);
      const burnedStr = parseFloat(formatEther(deadBal)).toFixed(2);

      setTotalSupply(supplyStr);
      setVaultBalance(vaultStr);
      setAdditionalWalletBalance(additionalStr);
      setTotalBurned(burnedStr);

      onDataLoaded?.({
        totalSupply: supplyStr,
        totalBurned: burnedStr,
        vaultBalance: vaultStr,
        additionalWalletBalance: additionalStr,
        loading: false,
      });
    } catch (err) {
      console.error('Error loading token data:', err);
    } finally {
      setLoading(false);
    }
  }, [onDataLoaded]);

  useEffect(() => {
    loadContractData();
  }, [loadContractData]);

  if (loading) {
    return <p className="text-black text-base">Loading token data...</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h3 className="text-[#977039] text-lg font-bold mb-4">Total Supply</h3>
          <p className="text-black text-2xl font-bold">{formatNumber(totalSupply, 0)} $GRANDPA</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h3 className="text-[#977039] text-lg font-bold mb-4">Total Burned</h3>
          <p className="text-black text-2xl font-bold">{formatNumber(totalBurned, 0)} $GRANDPA</p>
          <p className="text-gray-500 text-base mt-2">
            ({totalBurned ? ((parseFloat(totalBurned) / 100000000) * 100).toFixed(2) : '0.00'}%)
          </p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h3 className="text-[#977039] text-lg font-bold mb-4">In Strategy Vault</h3>
          <p className="text-black text-2xl font-bold">
            {formatNumber(
              (parseFloat(vaultBalance || '0') + parseFloat(additionalWalletBalance || '0')).toFixed(2)
            )} $GRANDPA
          </p>
          <div className="mt-3 flex flex-col gap-1">
            <a href={`https://etherscan.io/address/${STRATEGY_VAULT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="text-[#977039] text-sm underline">Vault</a>
            <a href={`https://etherscan.io/address/${ADDITIONAL_WALLET_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="text-[#977039] text-sm underline">Bot</a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h3 className="text-[#977039] text-lg font-bold mb-4">Buy Tax</h3>
          <p className="text-black text-4xl font-bold my-3">6%</p>
          <p className="text-gray-500 mt-3">No team fee.</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h3 className="text-[#977039] text-lg font-bold mb-4">Sell Tax</h3>
          <p className="text-black text-4xl font-bold my-3">0%</p>
          <p className="text-gray-500 mt-3">No sell tax</p>
        </div>
      </div>

      <div className="mt-8 text-center py-8">
        <h3 className="text-[#977039] text-xl font-bold mb-6">Contract Addresses</h3>
        <div className="flex flex-col gap-5 max-w-3xl mx-auto">
          {[
            { label: 'Grandpa Coin', address: GRANDPA_COIN_ADDRESS },
            { label: 'Strategy Vault', address: STRATEGY_VAULT_ADDRESS },
            { label: 'Country Club', address: '0xf4C84ed6302b9214C63890cdA6d9f3a08cBCb410' },
          ].map(({ label, address }) => (
            <div key={address}>
              <p className="text-gray-500 font-bold mb-2">{label}</p>
              <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer" className="text-[#977039] break-all underline">
                {address}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
