'use client';

import { useState, useRef } from 'react';

const MYSTERY_IMAGE = 'https://ipfs.io/ipfs/Qme4RRP6Q5iWmjnwoqiY2xRdx9fc1cPdht9CA9JYQg8JEH';
const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';

type MatchResult = {
  sourceId: string;
  matchId: string;
  score: number;
  direction: 'from-macc' | 'to-macc';
  matchImageUrl: string;
  sourceImageUrl: string;
} | null;

export default function MaccMatchLookup() {
  const [tokenId, setTokenId] = useState('');
  const [direction, setDirection] = useState<'from-macc' | 'to-macc'>('from-macc');
  const [result, setResult] = useState<MatchResult>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMaccImage = async (id: string): Promise<string> => {
    try {
      const res = await fetch(`/api/metadata/${id}`);
      const data = await res.json();
      return data.image_url || MYSTERY_IMAGE;
    } catch {
      return MYSTERY_IMAGE;
    }
  };

  const fetchMaycImage = async (id: string): Promise<string> => {
    try {
      const res = await fetch('/api/nft-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress: MAYC_CONTRACT, tokenId: id }),
      });
      const data = await res.json();
      return data.metadata?.image || MYSTERY_IMAGE;
    } catch {
      return MYSTERY_IMAGE;
    }
  };

  const lookup = async (id: string, dir: 'from-macc' | 'to-macc') => {
    if (!id || !/^\d+$/.test(id)) {
      setResult(null);
      return;
    }
    setLoading(true);
    try {
      const apiDir = dir === 'from-macc' ? 'macc-to-mayc' : 'mayc-to-macc';
      const res = await fetch(`/api/matches/${apiDir}/${id}`);
      if (!res.ok) {
        setResult(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const maccId = dir === 'from-macc' ? id : data.match_id;
      const maycId = dir === 'from-macc' ? data.match_id : id;
      const [maccImage, maycImage] = await Promise.all([
        fetchMaccImage(maccId),
        fetchMaycImage(maycId),
      ]);
      setResult({
        sourceId: id,
        matchId: data.match_id,
        score: data.score,
        direction: dir,
        matchImageUrl: dir === 'from-macc' ? maycImage : maccImage,
        sourceImageUrl: dir === 'from-macc' ? maccImage : maycImage,
      });
    } catch {
      setResult(null);
    }
    setLoading(false);
  };

  const handleChange = (value: string) => {
    setTokenId(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => lookup(value, direction), 300);
  };

  const handleDirectionChange = (dir: 'from-macc' | 'to-macc') => {
    setDirection(dir);
    setResult(null);
    if (tokenId) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => lookup(tokenId, dir), 100);
    }
  };

  const maccId = result ? (result.direction === 'from-macc' ? result.sourceId : result.matchId) : null;
  const maycId = result ? (result.direction === 'from-macc' ? result.matchId : result.sourceId) : null;
  const maccImage = result ? (result.direction === 'from-macc' ? result.sourceImageUrl : result.matchImageUrl) : null;
  const maycImage = result ? (result.direction === 'from-macc' ? result.matchImageUrl : result.sourceImageUrl) : null;

  return (
    <div className="common-container px-4 mb-10">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-7/12">
          <h2 className="common-sub-title bayc-color mb-2">FIND YOUR MUTANT MATCH</h2>
          <p className="common-p mb-4">
            Enter a MACC or MAYC ID to find the closest trait match between the Mutant Grandpa and Mutant Ape collections.
          </p>

          <div className="flex rounded overflow-hidden border border-[#3b3b3b] mb-3">
            <button
              className={`flex-1 px-4 py-2 text-sm font-bold transition-colors ${direction === 'from-macc' ? 'bayc-bg text-black' : 'bg-transparent text-white'}`}
              onClick={() => handleDirectionChange('from-macc')}
            >
              MACC → MAYC
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-bold transition-colors ${direction === 'to-macc' ? 'bayc-bg text-black' : 'bg-transparent text-white'}`}
              onClick={() => handleDirectionChange('to-macc')}
            >
              MAYC → MACC
            </button>
          </div>

          <input
            placeholder={direction === 'from-macc' ? 'Enter MACC ID' : 'Enter MAYC ID'}
            value={tokenId}
            onChange={(e) => handleChange(e.target.value)}
          />

          {loading && <p className="text-sm bayc-color mt-2">Finding match...</p>}
        </div>

        <div className="lg:w-5/12">
          {result && !loading ? (
            <div className="flex gap-3 items-center">
              <div className="w-5/12">
                <img className="w-full rounded-md" src={maccImage!} alt={`MACC #${maccId}`} loading="lazy" />
                <p className="kitten-caption mt-1 text-center">MACC #{maccId}</p>
              </div>
              <div className="w-2/12 text-center">
                <div className="text-xl font-bold bayc-color">{result.score}%</div>
                <div className="text-xs">match</div>
              </div>
              <div className="w-5/12">
                <img className="w-full rounded-md" src={maycImage!} alt={`MAYC #${maycId}`} loading="lazy" />
                <p className="kitten-caption mt-1 text-center">MAYC #{maycId}</p>
              </div>
            </div>
          ) : (
            <img className="w-full rounded-md" src={MYSTERY_IMAGE} alt="mystery token" />
          )}
        </div>
      </div>
    </div>
  );
}
