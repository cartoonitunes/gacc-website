'use client';

import { useState, useEffect, useCallback } from 'react';

const GRANDPA_COIN_ADDRESS = '0x20BFd82E6AD6A39cf4bD1F803e662FC065cD3d5F';
const DEX_PAIR = '0xc2f9673849ea38fae55c29e18e797f36b18a3078';

function formatNumber(num: number | string | null, decimals = 2): string {
  if (!num) return '0';
  return parseFloat(String(num)).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

interface DexData {
  priceUsd?: string;
  priceNative?: string;
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  priceChange?: { h24?: number };
}

interface PriceDisplayProps {
  vaultBalance: string | null;
  additionalWalletBalance: string | null;
}

const gold = '#977039';
const gray = '#6b7280';

export { DEX_PAIR, GRANDPA_COIN_ADDRESS };

export default function PriceDisplay({ vaultBalance, additionalWalletBalance }: PriceDisplayProps) {
  const [dexData, setDexData] = useState<DexData | null>(null);
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const [estimatedEth, setEstimatedEth] = useState<number | null>(null);
  const [loadingMarketData, setLoadingMarketData] = useState(false);

  const fetchMarketData = useCallback(async () => {
    setLoadingMarketData(true);
    try {
      const [dexResponse, floorPriceResponse] = await Promise.all([
        fetch(`https://api.dexscreener.com/latest/dex/pairs/ethereum/${DEX_PAIR}`),
        fetch('/api/gacc-floor-price'),
      ]);

      if (dexResponse.ok) {
        const data = await dexResponse.json();
        setDexData(data.pair || data.pairs?.[0] || null);
      }

      if (floorPriceResponse.ok) {
        const data = await floorPriceResponse.json();
        if (data.floorPrice != null) setFloorPrice(data.floorPrice);
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
    } finally {
      setLoadingMarketData(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    if (dexData && vaultBalance && additionalWalletBalance) {
      const totalGrandpa = parseFloat(vaultBalance) + parseFloat(additionalWalletBalance);
      const priceNative = parseFloat(dexData.priceNative || '0');
      const grandpaValueInEth = totalGrandpa * priceNative;
      setEstimatedEth(grandpaValueInEth * 0.95);
    }
  }, [dexData, vaultBalance, additionalWalletBalance]);

  return (
    <div>
      {loadingMarketData ? (
        <div className="text-center py-5">
          <p style={{ color: gray }}>Loading market data...</p>
        </div>
      ) : dexData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-white p-5 rounded-lg shadow-md text-center">
            <h3 style={{ color: gold }} className="text-sm font-bold mb-3">Price (USD)</h3>
            <p style={{ color: 'black' }} className="text-xl font-bold">${parseFloat(dexData.priceUsd || '0').toFixed(6)}</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md text-center">
            <h3 style={{ color: gold }} className="text-sm font-bold mb-3">24h Volume</h3>
            <p style={{ color: 'black' }} className="text-xl font-bold">${formatNumber(dexData.volume?.h24 || 0, 2)}</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md text-center">
            <h3 style={{ color: gold }} className="text-sm font-bold mb-3">Liquidity</h3>
            <p style={{ color: 'black' }} className="text-xl font-bold">${formatNumber(dexData.liquidity?.usd || 0, 2)}</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md text-center">
            <h3 style={{ color: gold }} className="text-sm font-bold mb-3">24h Change</h3>
            <p className="text-xl font-bold" style={{ color: (dexData.priceChange?.h24 || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
              {(dexData.priceChange?.h24 || 0) >= 0 ? '+' : ''}{(dexData.priceChange?.h24 || 0).toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h3 style={{ color: gold }} className="text-lg font-bold mb-4">GACC Floor Price</h3>
          {floorPrice !== null ? (
            <p style={{ color: 'black' }} className="text-2xl font-bold">{formatNumber(floorPrice, 4)} ETH</p>
          ) : (
            <p style={{ color: gray }}>Loading...</p>
          )}
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h3 style={{ color: gold }} className="text-lg font-bold mb-4">Estimated ETH (Vault + Bot)</h3>
          {estimatedEth !== null ? (
            <p style={{ color: 'black' }} className="text-2xl font-bold">{formatNumber(estimatedEth, 4)} ETH</p>
          ) : (
            <p style={{ color: gray }}>Calculating...</p>
          )}
          <p style={{ color: gray }} className="text-sm mt-3 italic">(5% haircut for gas &amp; slippage)</p>
        </div>
      </div>

      {floorPrice !== null && estimatedEth !== null && (
        <div className="bg-white p-8 rounded-lg shadow-md mt-5">
          <h3 style={{ color: gold }} className="text-lg font-bold mb-5 text-center">Progress to Next NFT Purchase</h3>
          <div className="w-full h-12 bg-[#f9edcd] rounded-full overflow-hidden relative mb-4" style={{ border: `2px solid ${gold}` }}>
            <div
              className="h-full flex items-center justify-center font-bold text-sm transition-all duration-500"
              style={{
                background: `linear-gradient(to bottom right, ${gold}, #7a5a2e)`,
                color: '#f9edcd',
                width: `${Math.min((estimatedEth / floorPrice) * 100, 100)}%`,
                minWidth: estimatedEth > 0 ? '60px' : '0px',
              }}
            >
              {estimatedEth >= floorPrice ? 'Ready!' : `${((estimatedEth / floorPrice) * 100).toFixed(1)}%`}
            </div>
          </div>
          <div className="flex justify-between text-sm font-medium" style={{ color: gold }}>
            <span>0 ETH</span>
            <span className="font-bold text-base">{estimatedEth.toFixed(4)} ETH / {floorPrice.toFixed(4)} ETH</span>
            <span>{floorPrice.toFixed(4)} ETH</span>
          </div>
        </div>
      )}
    </div>
  );
}
