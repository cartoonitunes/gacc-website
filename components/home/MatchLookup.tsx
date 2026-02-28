'use client';

import { useState, useRef } from 'react';

const PROJECTS = [
  { label: 'BAYC', value: 'bayc', imageBase: 'https://ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/' },
];

const GACC_IMAGE_BASE = 'https://ipfs.io/ipfs/QmY6CdW5UGJPu76qm6SkBBiWPBcnH7sr4JMBcA9mjuaNSU/';

type MatchResult = {
  sourceId: string;
  matchId: string;
  score: number;
  direction: 'from-gacc' | 'to-gacc';
} | null;

export default function MatchLookup() {
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].value);
  const [tokenId, setTokenId] = useState('');
  const [direction, setDirection] = useState<'from-gacc' | 'to-gacc'>('from-gacc');
  const [result, setResult] = useState<MatchResult>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const project = PROJECTS.find(p => p.value === selectedProject)!;

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
      setResult({ sourceId: id, matchId: data.match_id, score: data.score, direction: dir });
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
      <div className="mb-5">
        <h2 className="common-title mb-2" style={{ color: 'black' }}>FIND YOUR MATCH</h2>
        <p className="common-p mb-4" style={{ color: 'black' }}>
          Enter a Grandpa Ape or {project.label} ID to find the closest trait match across collections.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {PROJECTS.length > 1 && (
            <select
              className="border border-gray-300 rounded px-3 py-2"
              value={selectedProject}
              onChange={(e) => { setSelectedProject(e.target.value); setResult(null); }}
            >
              {PROJECTS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          )}

          <div className="flex rounded overflow-hidden border border-gray-300">
            <button
              className={`px-4 py-2 text-sm font-bold transition-colors ${direction === 'from-gacc' ? 'bg-[#977039] text-white' : 'bg-white text-black'}`}
              onClick={() => handleDirectionChange('from-gacc')}
            >
              GACC → {project.label}
            </button>
            <button
              className={`px-4 py-2 text-sm font-bold transition-colors ${direction === 'to-gacc' ? 'bg-[#977039] text-white' : 'bg-white text-black'}`}
              onClick={() => handleDirectionChange('to-gacc')}
            >
              {project.label} → GACC
            </button>
          </div>

          <input
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-center"
            placeholder={direction === 'from-gacc' ? 'Enter GACC ID' : `Enter ${project.label} ID`}
            value={tokenId}
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>

        {loading && <p className="text-sm" style={{ color: '#977039' }}>Finding match...</p>}

        {result && !loading && (
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="sm:w-1/2">
              <div className="imageItem">
                {gaccImageId && (
                  <img
                    className="w-full rounded-md"
                    src={`${GACC_IMAGE_BASE}${gaccImageId}.png`}
                    alt={`GACC #${gaccId}`}
                    loading="lazy"
                  />
                )}
                <span className="caption mt-2">GACC #{gaccId}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#977039' }}>{result.score}%</div>
              <div className="text-xs" style={{ color: 'black' }}>match</div>
            </div>
            <div className="sm:w-1/2">
              <div className="imageItem">
                <img
                  className="w-full rounded-md"
                  src={`${project.imageBase}${otherId}`}
                  alt={`${project.label} #${otherId}`}
                  loading="lazy"
                />
                <span className="caption mt-2">{project.label} #{otherId}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
