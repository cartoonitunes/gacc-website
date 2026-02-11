'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';

const COUNTRY_CLUB_ADDRESS = '0xf4C84ed6302b9214C63890cdA6d9f3a08cBCb410';
const GACC_COLLECTION_ADDRESS = '0x4B103d07C18798365946E76845EDC6b565779402';

const COUNTRY_CLUB_ABI = [
  'function totalMembers() view returns (uint256)',
  'function members(uint256) view returns (address collection, uint256 tokenId, uint256 joinedAt, uint8 source)',
  'function isCollectionApproved(address collection) view returns (bool)',
];

const ERC721_ABI = [
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

interface NftMember {
  collection: string;
  tokenId: string;
  joinedAt: number;
  joinedAtFormatted: string;
  source: string;
}

interface NftMetadataMap {
  [key: string]: { name?: string; image?: string };
}

interface SenderInfo {
  sender: string;
  senderLabel?: string;
  senderEntity?: string;
  transactionHash?: string;
}

interface SenderMap {
  [key: string]: SenderInfo;
}

const gold = '#977039';
const gray = '#6b7280';

function NftImage({ imageUrl, nftName, loading: isLoading }: { imageUrl: string | null; nftName: string; loading: boolean }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className="w-full h-[200px] rounded-lg mb-3 bg-gray-100 flex items-center justify-center text-sm" style={{ color: gray }}>
        {isLoading ? 'Loading...' : 'No image'}
      </div>
    );
  }

  return (
    <div className="relative w-full mb-3">
      {!imageLoaded && (
        <div className="w-full h-[200px] rounded-lg bg-gray-100 flex items-center justify-center text-sm absolute inset-0" style={{ color: gray }}>
          Loading...
        </div>
      )}
      <img
        src={imageUrl}
        alt={nftName}
        className="w-full h-auto rounded-lg object-cover min-h-[200px] max-h-[300px] bg-gray-100"
        style={{ display: imageLoaded ? 'block' : 'none' }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
}

function getReadProvider() {
  return new JsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  );
}

export default function CountryClubGallery() {
  const { account, signer, isConnected, connectWallet } = useWallet();

  const [nftList, setNftList] = useState<NftMember[]>([]);
  const [nftMetadata, setNftMetadata] = useState<NftMetadataMap>({});
  const [nftSenders, setNftSenders] = useState<SenderMap>({});
  const [countryClubMembers, setCountryClubMembers] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [loadingSenders, setLoadingSenders] = useState(false);

  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [selectedNft, setSelectedNft] = useState<any>(null);
  const [userNfts, setUserNfts] = useState<Record<string, any[]>>({});
  const [transferring, setTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState('');

  const fetchNftMetadata = useCallback(async (nfts: NftMember[]) => {
    setLoadingMetadata(true);
    try {
      const nftBatch = nfts.map((nft) => ({ contractAddress: nft.collection, tokenId: nft.tokenId }));
      const res = await fetch('/api/nft-metadata-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfts: nftBatch }),
      });
      if (res.ok) {
        const data = await res.json();
        const map: NftMetadataMap = {};
        data.results.forEach((r: any) => {
          if (r.metadata) map[`${r.contractAddress}-${r.tokenId}`] = r.metadata;
        });
        setNftMetadata(map);
      }
    } catch (err) {
      console.error('Error fetching NFT metadata:', err);
    } finally {
      setLoadingMetadata(false);
    }
  }, []);

  const fetchNftSenders = useCallback(async (nfts: NftMember[]) => {
    setLoadingSenders(true);
    try {
      const nftBatch = nfts.map((nft) => ({ collection: nft.collection, tokenId: nft.tokenId, joinedAt: nft.joinedAt }));
      const res = await fetch('/api/nft-senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfts: nftBatch, countryClubAddress: COUNTRY_CLUB_ADDRESS }),
      });
      if (res.ok) {
        const data = await res.json();
        setNftSenders(data.results || {});
      }
    } catch (err) {
      console.error('Error fetching NFT senders:', err);
    } finally {
      setLoadingSenders(false);
    }
  }, []);

  const loadContractData = useCallback(async () => {
    try {
      const provider = getReadProvider();
      const countryClubContract = new Contract(COUNTRY_CLUB_ADDRESS, COUNTRY_CLUB_ABI, provider);
      const memberCount = await countryClubContract.totalMembers();
      const count = Math.min(Number(memberCount), 50);
      setCountryClubMembers(String(memberCount));

      if (count > 0) {
        const nfts: NftMember[] = [];
        for (let i = 0; i < count; i++) {
          try {
            const member = await countryClubContract.members(i);
            const joinedAtTimestamp = Number(member.joinedAt);
            nfts.push({
              collection: member.collection,
              tokenId: String(member.tokenId),
              joinedAt: joinedAtTimestamp,
              joinedAtFormatted: new Date(joinedAtTimestamp * 1000).toLocaleDateString(),
              source: member.source === 0n ? 'Strategy' : 'Holder',
            });
          } catch (err) {
            console.error(`Error fetching member ${i}:`, err);
          }
        }
        setNftList(nfts);
        if (nfts.length > 0) {
          fetchNftMetadata(nfts);
          fetchNftSenders(nfts);
        }
      }
    } catch (err) {
      console.error('Error loading contract data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchNftMetadata, fetchNftSenders]);

  useEffect(() => {
    loadContractData();
  }, [loadContractData]);

  const loadUserNfts = useCallback(async (collectionAddress: string) => {
    if (!account) return;
    try {
      const res = await fetch(
        `https://eth-mainnet.g.alchemy.com/nft/v3/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTsForOwner?owner=${account}&contractAddresses[]=${collectionAddress}&pageSize=100`
      );
      const data = await res.json();
      const nfts = (data.ownedNfts || []).map((nft: any) => ({
        tokenId: nft.tokenId,
        name: nft.name || `#${nft.tokenId}`,
        image: nft.image?.originalUrl || nft.image?.pngUrl || nft.image?.cachedUrl || null,
        collection: collectionAddress,
      }));
      setUserNfts((prev) => ({ ...prev, [collectionAddress]: nfts }));
    } catch (err) {
      console.error('Error loading user NFTs:', err);
    }
  }, [account]);

  const transferToCountryClub = useCallback(async () => {
    if (!signer || !account || !selectedNft || !selectedCollection) return;

    setTransferring(true);
    setTransferStatus('');

    try {
      const nftContract = new Contract(selectedCollection, ERC721_ABI, signer);
      const tx = await nftContract.safeTransferFrom(account, COUNTRY_CLUB_ADDRESS, selectedTokenId);
      await tx.wait();

      setTransferStatus(`Success! Transaction: ${tx.hash}`);
      setSelectedCollection('');
      setSelectedTokenId('');
      setSelectedNft(null);
      setTimeout(() => loadContractData(), 3000);
    } catch (err: any) {
      setTransferStatus(`Error: ${err.message}`);
    } finally {
      setTransferring(false);
    }
  }, [signer, account, selectedNft, selectedCollection, selectedTokenId, loadContractData]);

  return (
    <div>
      <div id="deposit-nft" className="mb-10">
        <h2 className="common-title mb-3" style={{ color: 'black' }}>DEPOSIT NFT TO COUNTRY CLUB</h2>
        <p className="common-p mb-4" style={{ color: 'black' }}>
          Connect your wallet and deposit an approved NFT to the Country Club. Once deposited, your NFT will be enshrined eternally and cannot be removed.
        </p>

        {!isConnected ? (
          <div className="bg-white p-10 rounded-lg shadow-md text-center">
            <button
              type="button"
              onClick={connectWallet}
              style={{ backgroundColor: gold, color: 'white' }}
              className="font-bold py-4 px-8 rounded text-lg"
            >
              CONNECT WALLET
            </button>
            <p style={{ color: gray }} className="text-sm mt-4">Connect your wallet to deposit NFTs to the Country Club</p>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="mb-5">
              <p style={{ color: gray }} className="text-sm mb-1">Connected Wallet:</p>
              <p style={{ color: 'black' }} className="font-bold">{account?.slice(0, 6)}...{account?.slice(-4)}</p>
            </div>

            <div className="mb-5">
              <label style={{ color: gold }} className="font-bold block mb-2">Select Collection:</label>
              <select
                value={selectedCollection}
                onChange={async (e) => {
                  setSelectedCollection(e.target.value);
                  setSelectedTokenId('');
                  setSelectedNft(null);
                  if (e.target.value) await loadUserNfts(e.target.value);
                }}
                className="w-full p-3 rounded bg-white"
                style={{ color: 'black', borderWidth: '2px', borderColor: gold }}
              >
                <option value="">-- Select a collection --</option>
                <option value={GACC_COLLECTION_ADDRESS}>Grandpa Ape Country Club</option>
              </select>
            </div>

            {selectedCollection && userNfts[selectedCollection] && (
              <div className="mb-5">
                <label style={{ color: gold }} className="font-bold block mb-2">Select NFT:</label>
                <select
                  value={selectedTokenId}
                  onChange={(e) => {
                    setSelectedTokenId(e.target.value);
                    const nft = userNfts[selectedCollection]?.find((n: any) => n.tokenId === e.target.value);
                    setSelectedNft(nft || null);
                  }}
                  className="w-full p-3 rounded bg-white"
                  style={{ color: 'black', borderWidth: '2px', borderColor: gold }}
                >
                  <option value="">-- Select an NFT --</option>
                  {userNfts[selectedCollection].map((nft: any) => (
                    <option key={nft.tokenId} value={nft.tokenId}>{nft.name || `#${nft.tokenId}`}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedNft && (
              <>
                <div className="mb-5 p-5 bg-[#f9edcd] rounded-lg text-center">
                  <h3 style={{ color: gold }} className="text-lg mb-4">Preview</h3>
                  {selectedNft.image && (
                    <img
                      src={selectedNft.image}
                      alt={selectedNft.name}
                      className="max-w-[300px] w-full h-auto rounded-lg mb-4 mx-auto"
                      style={{ borderWidth: '2px', borderColor: gold }}
                    />
                  )}
                  <p style={{ color: 'black' }} className="font-bold mb-1">{selectedNft.name}</p>
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={transferToCountryClub}
                    disabled={transferring}
                    style={{ backgroundColor: gold, color: 'white' }}
                    className="font-bold py-4 px-10 rounded text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {transferring ? 'TRANSFERRING...' : 'DEPOSIT TO COUNTRY CLUB'}
                  </button>
                  {transferStatus && (
                    <p className={`text-sm mt-4 ${transferStatus.includes('Error') ? 'text-red-600' : 'text-green-700'}`} style={{ color: transferStatus.includes('Error') ? '#dc2626' : '#15803d' }}>
                      {transferStatus}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <hr className="gray-line mb-10" />

      <div id="country-club">
        <h2 className="common-title mb-3" style={{ color: 'black' }}>THE COUNTRY CLUB</h2>
        <p className="common-p mb-4" style={{ color: 'black' }}>
          NFTs purchased by the Strategy Vault bot are automatically sent to the Country Club contract, where they are enshrined eternally and cannot be removed. These NFTs represent the permanent treasury of the Grandpa Ape ecosystem.
        </p>

        {loading ? (
          <p style={{ color: 'black' }}>Loading Country Club data...</p>
        ) : (
          <div>
            <div className="bg-white p-5 rounded-lg shadow-md mb-5">
              <h3 style={{ color: gold }} className="text-xl mb-3">
                Country Club Members: {countryClubMembers || 'None Yet!'}
              </h3>
              <a href={`https://etherscan.io/address/${COUNTRY_CLUB_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ color: gold }} className="text-sm">
                View Contract on Etherscan
              </a>
            </div>

            {nftList.length > 0 && (
              <div>
                <h3 style={{ color: 'black' }} className="text-lg font-bold mb-4">Recent Additions</h3>
                {loadingMetadata && (
                  <p style={{ color: gray }} className="text-sm mb-4 text-center">Loading NFT images...</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {nftList.slice(0, 18).map((nft, index) => {
                    const metadataKey = `${nft.collection}-${nft.tokenId}`;
                    const metadata = nftMetadata[metadataKey];
                    const senderInfo = nftSenders[metadataKey];
                    const imageUrl = metadata?.image || null;
                    const nftName = metadata?.name || `${nft.collection === GACC_COLLECTION_ADDRESS ? 'GACC' : 'NFT'} #${nft.tokenId}`;

                    return (
                      <div key={index} className="bg-white p-4 rounded-lg shadow-md flex flex-col">
                        <NftImage imageUrl={imageUrl} nftName={nftName} loading={loadingMetadata} />
                        <h4 style={{ color: gold }} className="text-sm font-bold mb-2 min-h-[40px] flex items-center justify-center text-center">
                          {nftName}
                        </h4>
                        <div className="mt-auto pt-3">
                          <p style={{ color: gray }} className="text-xs mb-1">Source: {nft.source}</p>
                          {senderInfo && (
                            <p style={{ color: gray }} className="text-xs mb-1">
                              From:{' '}
                              <a
                                href={`https://etherscan.io/address/${senderInfo.sender}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: gold }}
                                className="underline"
                                title={senderInfo.sender}
                              >
                                {senderInfo.senderLabel || senderInfo.senderEntity || `${senderInfo.sender.slice(0, 6)}...${senderInfo.sender.slice(-4)}`}
                              </a>
                            </p>
                          )}
                          {loadingSenders && !senderInfo && (
                            <p style={{ color: '#9ca3af' }} className="text-xs italic mb-1">Loading sender...</p>
                          )}
                          <p style={{ color: gray }} className="text-xs">Joined: {nft.joinedAtFormatted}</p>
                          <div className="mt-2 flex flex-col gap-1">
                            <a
                              href={`https://opensea.io/assets/ethereum/${nft.collection}/${nft.tokenId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: gold }}
                              className="text-xs underline"
                            >
                              View on OpenSea
                            </a>
                            {senderInfo?.transactionHash && (
                              <a
                                href={`https://etherscan.io/tx/${senderInfo.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: gold }}
                                className="text-xs underline"
                              >
                                View Transaction
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {nftList.length > 18 && (
                  <p style={{ color: gray }} className="text-sm mt-4 text-center">Showing first 18 of {nftList.length} members</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
