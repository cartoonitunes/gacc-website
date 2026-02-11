'use client';

import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const GACC_COLLECTION_ADDRESS = '0x4B103d07C18798365946E76845EDC6b565779402';

interface ApiStory {
  tokenId: string;
  name: string;
  title: string;
  description: string;
  storyContent: string[];
  images?: { url: string; alt: string }[];
}

const gold = '#977039';

function parseMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let currentIndex = 0;
  let key = 0;
  const regex = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      parts.push(<strong key={key++}>{match[3]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={key++}>{match[4]}</em>);
    }
    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export default function StoryCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiStories, setApiStories] = useState<Record<string, ApiStory>>({});
  const [nftMetadata, setNftMetadata] = useState<Record<string, { name?: string; image?: string }>>({});
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyTokenId, setStoryTokenId] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch('/api/nft-stories');
      const data = await res.json();
      if (data.success && data.stories) {
        const map: Record<string, ApiStory> = {};
        data.stories.forEach((story: ApiStory) => {
          map[story.tokenId] = story;
        });
        setApiStories(map);

        const nftBatch = data.stories.map((s: ApiStory) => ({
          contractAddress: GACC_COLLECTION_ADDRESS,
          tokenId: s.tokenId,
        }));
        const metaRes = await fetch('/api/nft-metadata-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nfts: nftBatch }),
        });
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          const metaMap: Record<string, { name?: string; image?: string }> = {};
          metaData.results?.forEach((r: any) => {
            if (r.metadata) metaMap[`${r.contractAddress}-${r.tokenId}`] = r.metadata;
          });
          setNftMetadata(metaMap);
        }
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    const storyParam = searchParams.get('story');
    if (storyParam && apiStories[storyParam]) {
      setStoryTokenId(storyParam);
      setShowStoryModal(true);
    }
  }, [searchParams, apiStories]);

  const closeModal = () => {
    setShowStoryModal(false);
    setStoryTokenId(null);
    router.push('/grandpacoin');
  };

  const openStory = (tokenId: string) => {
    setStoryTokenId(tokenId);
    setShowStoryModal(true);
    router.push(`/grandpacoin?story=${tokenId}`);
  };

  const storyList = useMemo(() => Object.values(apiStories), [apiStories]);

  return (
    <>
      {storyList.length > 0 && (
        <div id="stories" className="mb-10">
          <h2 className="common-title mb-6" style={{ color: 'black' }}>STORIES</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {storyList.map((story) => {
              const metaKey = `${GACC_COLLECTION_ADDRESS}-${story.tokenId}`;
              const meta = nftMetadata[metaKey];
              return (
                <button
                  key={story.tokenId}
                  type="button"
                  onClick={() => openStory(story.tokenId)}
                  className="bg-white p-4 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow cursor-pointer text-left"
                >
                  {meta?.image && (
                    <img
                      src={meta.image}
                      alt={`Grandpa Ape #${story.tokenId}`}
                      className="w-full h-auto rounded-lg mb-3"
                      loading="lazy"
                    />
                  )}
                  <h4 style={{ color: gold }} className="text-sm font-bold mb-1">
                    Grandpa Ape #{story.tokenId}
                  </h4>
                  <p style={{ color: 'black' }} className="text-xs italic">{story.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showStoryModal && storyTokenId && apiStories[storyTokenId] && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="bg-[#f9edcd] rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 rounded-full w-9 h-9 flex items-center justify-center font-bold text-xl"
              style={{ backgroundColor: gold, color: 'white' }}
            >
              x
            </button>

            <div className="text-center mb-8">
              {nftMetadata[`${GACC_COLLECTION_ADDRESS}-${storyTokenId}`]?.image && (
                <img
                  src={nftMetadata[`${GACC_COLLECTION_ADDRESS}-${storyTokenId}`].image}
                  alt={`Grandpa Ape #${storyTokenId}`}
                  className="max-w-[300px] w-full h-auto rounded-lg mb-4 mx-auto"
                  style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: gold }}
                />
              )}
              <h2 style={{ color: gold }} className="text-3xl font-bold mb-3">Grandpa Ape #{storyTokenId}</h2>
              <h3 style={{ color: 'black' }} className="text-xl italic">{apiStories[storyTokenId].name}</h3>
            </div>

            <div className="text-lg leading-relaxed mb-8">
              {apiStories[storyTokenId].storyContent.map((paragraph, index) => (
                <p key={index} style={{ color: '#111827' }} className="mb-5">{parseMarkdown(paragraph)}</p>
              ))}
            </div>

            {apiStories[storyTokenId].images && apiStories[storyTokenId].images!.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
                {apiStories[storyTokenId].images!.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export { type ApiStory };
export { GACC_COLLECTION_ADDRESS };
