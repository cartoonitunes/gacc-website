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
    <section className="px-4">
      <div className="mb-10 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-7/12">
          <h2 className="text-2xl font-bold text-black mb-3">THE SPECS</h2>
          <p className="text-black text-base leading-relaxed">
            Each Grandpa Ape is unique and programmatically generated from over 200 possible traits, including expression, headwear, clothing, and more. All apes are spiffy, but some are rarer than others.
          </p>
          <p className="text-black text-base leading-relaxed mt-4 mb-4">
            The apes are stored as ERC-721 tokens on the Ethereum blockchain and hosted on IPFS.
          </p>
          <label htmlFor="apeId" className="text-black font-bold text-base mb-2 block">Lookup Rarity</label>
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
            <div className="relative">
              <img
                className="w-full rounded-md"
                src={`https://ipfs.io/ipfs/QmY6CdW5UGJPu76qm6SkBBiWPBcnH7sr4JMBcA9mjuaNSU/${tokenId}.png`}
                alt={`GACC #${tokenId}`}
                loading="lazy"
              />
              <span className="block text-center mt-2 text-black font-bold">Rank #{rankToShow}</span>
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
    </section>
  );
}
