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

  const ethAmount = '0.05';

  return (
    <div>
      {loadingMarketData ? (
        <div className="text-center py-5">
          <p className="text-gray-500">Loading market data...</p>
        </div>
      ) : dexData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-white p-5 rounded-lg shadow-md text-center">
            <h3 className="text-[#977039] text-sm font-bold mb-3">Price (USD)</h3>
            <p className="text-black text-xl font-bold">${parseFloat(dexData.priceUsd || '0').toFixed(6)}</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md text-center">
            <h3 className="text-[#977039] text-sm font-bold mb-3">24h Volume</h3>
            <p className="text-black text-xl font-bold">${formatNumber(dexData.volume?.h24 || 0, 2)}</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md text-center">
            <h3 className="text-[#977039] text-sm font-bold mb-3">Liquidity</h3>
            <p className="text-black text-xl font-bold">${formatNumber(dexData.liquidity?.usd || 0, 2)}</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md text-center">
            <h3 className="text-[#977039] text-sm font-bold mb-3">24h Change</h3>
            <p className={`text-xl font-bold ${(dexData.priceChange?.h24 || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(dexData.priceChange?.h24 || 0) >= 0 ? '+' : ''}{(dexData.priceChange?.h24 || 0).toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h3 className="text-[#977039] text-lg font-bold mb-4">GACC Floor Price</h3>
          {floorPrice !== null ? (
            <p className="text-black text-2xl font-bold">{formatNumber(floorPrice, 4)} ETH</p>
          ) : (
            <p className="text-gray-500">Loading...</p>
          )}
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h3 className="text-[#977039] text-lg font-bold mb-4">Estimated ETH (Vault + Bot)</h3>
          {estimatedEth !== null ? (
            <p className="text-black text-2xl font-bold">{formatNumber(estimatedEth, 4)} ETH</p>
          ) : (
            <p className="text-gray-500">Calculating...</p>
          )}
          <p className="text-gray-500 text-sm mt-3 italic">(5% haircut for gas &amp; slippage)</p>
        </div>
      </div>

      {floorPrice !== null && estimatedEth !== null && (
        <div className="bg-white p-8 rounded-lg shadow-md mt-5">
          <h3 className="text-[#977039] text-lg font-bold mb-5 text-center">Progress to Next NFT Purchase</h3>
          <div className="w-full h-12 bg-[#f9edcd] rounded-full overflow-hidden relative border-2 border-[#977039] mb-4">
            <div
              className="h-full bg-gradient-to-br from-[#977039] to-[#7a5a2e] flex items-center justify-center text-[#f9edcd] font-bold text-sm transition-all duration-500"
              style={{
                width: `${Math.min((estimatedEth / floorPrice) * 100, 100)}%`,
                minWidth: estimatedEth > 0 ? '60px' : '0px',
              }}
            >
              {estimatedEth >= floorPrice ? 'Ready!' : `${((estimatedEth / floorPrice) * 100).toFixed(1)}%`}
            </div>
          </div>
          <div className="flex justify-between text-sm text-[#977039] font-medium">
            <span>0 ETH</span>
            <span className="font-bold text-base">{estimatedEth.toFixed(4)} ETH / {floorPrice.toFixed(4)} ETH</span>
            <span>{floorPrice.toFixed(4)} ETH</span>
          </div>
        </div>
      )}

      <div id="chart" className="mt-10">
        <h2 className="text-2xl font-bold text-black mb-3">GRANDPA COIN CHART</h2>
        <div className="relative w-full" style={{ paddingBottom: '125%' }}>
          <iframe
            className="absolute inset-0 w-full h-full border-0"
            title="Embed GRANDPA / WETH 1%"
            src={`https://www.geckoterminal.com/eth/pools/${DEX_PAIR}?embed=1&info=1&swaps=1&grayscale=0&light_chart=0&chart_type=price&resolution=15m`}
            allow="clipboard-write"
            allowFullScreen
          />
        </div>
      </div>

      <hr className="border-gray-300 my-10" />

      <div id="buy-grandpacoin">
        <div className="bg-white p-4 flex flex-col lg:flex-row items-center gap-4 rounded">
          <div className="lg:w-3/12">
            <h3 className="text-xl font-bold text-black">BUY GRANDPA COIN</h3>
          </div>
          <div className="lg:w-4/12 lg:ml-4">
            <p className="text-black text-sm">Swap ETH for $GRANDPA on Uniswap. Connect your wallet and complete the swap on Uniswap&apos;s secure interface.</p>
          </div>
          <div className="lg:w-2/12 lg:ml-auto">
            <a
              href={`https://app.uniswap.org/#/swap?exactField=input&exactAmount=${ethAmount}&inputCurrency=ETH&outputCurrency=${GRANDPA_COIN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="bg-[#83D8FC] text-black font-bold py-2 px-6 rounded w-full" type="button">SWAP ON UNISWAP</button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
