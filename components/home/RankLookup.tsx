'use client';

import { useState, useRef, useCallback } from 'react';

export default function RankLookup() {
  const [apeSelection, setApeSelection] = useState<string | null>(null);
  const [rankToShow, setRankToShow] = useState<number | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRank = useCallback(async (tokenId: string) => {
    if (!tokenId) {
      setRankToShow(null);
      return;
    }
    try {
      const res = await fetch(`/api/gacc/ranks/${tokenId}`);
      const data = await res.json();
      setRankToShow(data.rank ?? null);
    } catch {
      setRankToShow(null);
    }
  }, []);

  const handleChange = (value: string) => {
    setApeSelection(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRank(value), 300);
  };

  const isValid = apeSelection && /^\d+$/.test(apeSelection) && Number(apeSelection) >= 0 && Number(apeSelection) < 5000;
  const tokenId = apeSelection ? Number(apeSelection) + 1 : null;

  return (
    <section className="common-container px-4">
      <div className="mb-5 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-7/12">
          <h2 className="common-title" style={{ color: 'black' }}>THE SPECS</h2>
          <p className="common-p" style={{ color: 'black' }}>
            Each Grandpa Ape is unique and programmatically generated from over 200 possible traits, including expression, headwear, clothing, and more. All apes are spiffy, but some are rarer than others.
          </p>
          <p className="common-p mt-4 mb-4" style={{ color: 'black' }}>
            The apes are stored as ERC-721 tokens on the Ethereum blockchain and hosted on IPFS.
          </p>
          <label htmlFor="apeId" className="bold-text text-base mb-2 block" style={{ color: 'black' }}>Lookup Rarity</label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 text-center"
            name="apeId"
            id="apeId"
            placeholder="1"
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>
        <div className="lg:w-4/12 lg:ml-auto my-auto">
          {isValid && tokenId && rankToShow ? (
            <div className="imageItem">
              <img
                className="w-full rounded-md"
                src={`https://ipfs.io/ipfs/QmY6CdW5UGJPu76qm6SkBBiWPBcnH7sr4JMBcA9mjuaNSU/${tokenId}.png`}
                alt={`GACC #${tokenId}`}
                loading="lazy"
              />
              <span className="caption mt-2">Rank #{rankToShow}</span>
            </div>
          ) : (
            <img
              className="w-full rounded-md"
              src="/assets/images/Sneak_Peek_Preview.gif"
              alt="mystery token"
            />
          )}
        </div>
      </div>

      <hr className="gray-line mb-5" />

      <div className="mb-5 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-7/12">
          <h2 className="common-title" style={{ color: 'black' }}>GRANDPA STRATEGY</h2>
          <p className="common-p" style={{ color: 'black' }}>
            Grandpa Coin ($GRANDPA) is a strategy token that powers the Grandpa Ape Country Club ecosystem through an innovative buy-burn-lock strategy. With each purchase, 6% of the transaction goes directly to a Strategy Vault contract, where an autonomous bot continuously monitors the floor price of Grandpa NFTs and burns a percentage of $GRANDPA each time.
          </p>
          <p className="common-p mt-4" style={{ color: 'black' }}>
            This creates a perpetual buy pressure mechanism that strengthens the Grandpa Ape collection while rewarding holders through the deflationary nature of the token.
          </p>
        </div>
        <div className="lg:w-3/12 lg:ml-auto my-auto">
          <a href="/grandpacoin">
            <button className="bayc-button w-full" style={{ backgroundColor: '#83D8FC', color: 'black' }} type="button">
              GRANDPA COIN
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}
