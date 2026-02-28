'use client';

import { useState, useRef } from 'react';

const BAYC_CONTRACT = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
const GACC_IMAGE_BASE = 'https://ipfs.io/ipfs/QmY6CdW5UGJPu76qm6SkBBiWPBcnH7sr4JMBcA9mjuaNSU/';

const PROJECTS = [
  { label: 'BAYC', value: 'bayc', contract: BAYC_CONTRACT },
];

type MatchResult = {
  sourceId: string;
  matchId: string;
  score: number;
  direction: 'from-gacc' | 'to-gacc';
  otherImageUrl: string;
} | null;

export default function MatchLookup() {
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].value);
  const [tokenId, setTokenId] = useState('');
  const [direction, setDirection] = useState<'from-gacc' | 'to-gacc'>('from-gacc');
  const [result, setResult] = useState<MatchResult>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const project = PROJECTS.find(p => p.value === selectedProject)!;

  const fetchImage = async (contract: string, id: string): Promise<string> => {
    try {
      const res = await fetch('/api/nft-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress: contract, tokenId: id }),
      });
      const data = await res.json();
      return data.metadata?.image || '';
    } catch {
      return '';
    }
  };

  const lookup = async (id: string, dir: 'from-gacc' | 'to-gacc') => {
    if (!id || !/^\d+$/.test(id)) {
      setResult(null);
      return;
    }
    setLoading(true);
    try {
      const apiDir = dir === 'from-gacc' ? `gacc-to-${selectedProject}` : `${selectedProject}-to-gacc`;
      const res = await fetch(`/api/matches/${apiDir}/${id}`);
      if (!res.ok) {
        setResult(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const otherId = dir === 'from-gacc' ? data.match_id : id;
      const imageUrl = await fetchImage(project.contract, otherId);
      setResult({ sourceId: id, matchId: data.match_id, score: data.score, direction: dir, otherImageUrl: imageUrl });
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

  const handleDirectionChange = (dir: 'from-gacc' | 'to-gacc') => {
    setDirection(dir);
    setResult(null);
    if (tokenId) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => lookup(tokenId, dir), 100);
    }
  };

  const gaccId = result ? (result.direction === 'from-gacc' ? result.sourceId : result.matchId) : null;
  const otherId = result ? (result.direction === 'from-gacc' ? result.matchId : result.sourceId) : null;
  const gaccImageId = gaccId ? Number(gaccId) + 1 : null;

  return (
    <section className="common-container px-4">
      <div className="mb-5 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-7/12">
          <h2 className="common-title" style={{ color: 'black' }}>FIND YOUR MATCH</h2>
          <p className="common-p mb-4" style={{ color: 'black' }}>
            Enter a Grandpa Ape or {project.label} ID to find the closest trait match across collections.
          </p>

          {PROJECTS.length > 1 && (
            <select
              className="border border-gray-300 rounded px-3 py-2 mb-3 w-full"
              value={selectedProject}
              onChange={(e) => { setSelectedProject(e.target.value); setResult(null); }}
            >
              {PROJECTS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          )}

          <div className="flex rounded overflow-hidden border border-gray-300 mb-3">
            <button
              className={`flex-1 px-4 py-2 text-sm font-bold transition-colors ${direction === 'from-gacc' ? 'bg-[#977039] text-white' : 'bg-white text-black'}`}
              onClick={() => handleDirectionChange('from-gacc')}
            >
              GACC → {project.label}
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-bold transition-colors ${direction === 'to-gacc' ? 'bg-[#977039] text-white' : 'bg-white text-black'}`}
              onClick={() => handleDirectionChange('to-gacc')}
            >
              {project.label} → GACC
            </button>
          </div>

          <input
            className="w-full border border-gray-300 rounded px-3 py-2 text-center"
            placeholder={direction === 'from-gacc' ? 'Enter GACC ID' : `Enter ${project.label} ID`}
            value={tokenId}
            onChange={(e) => handleChange(e.target.value)}
          />

          {loading && <p className="text-sm mt-2" style={{ color: '#977039' }}>Finding match...</p>}
        </div>

        <div className="lg:w-5/12 flex items-center justify-center">
          {result && !loading ? (
            <div className="flex gap-3 items-center w-full">
              <div className="w-5/12">
                {gaccImageId && (
                  <img
                    className="w-full rounded-md"
                    src={`${GACC_IMAGE_BASE}${gaccImageId}.png`}
                    alt={`GACC #${gaccId}`}
                    loading="lazy"
                  />
                )}
                <p className="caption mt-1 text-center" style={{ color: 'black' }}>GACC #{gaccId}</p>
              </div>
              <div className="w-2/12 text-center">
                <div className="text-xl font-bold" style={{ color: '#977039' }}>{result.score}%</div>
                <div className="text-xs" style={{ color: 'black' }}>match</div>
              </div>
              <div className="w-5/12">
                {result.otherImageUrl && (
                  <img
                    className="w-full rounded-md"
                    src={result.otherImageUrl}
                    alt={`${project.label} #${otherId}`}
                    loading="lazy"
                  />
                )}
                <p className="caption mt-1 text-center" style={{ color: 'black' }}>{project.label} #{otherId}</p>
              </div>
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
