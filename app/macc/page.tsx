'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { getMACCContract } from '@/lib/blockchain/contracts';
import { Navbar } from '@/components/layout/Navbar';

const LEGENDARIES = ['0','1','2','3','4','5','6','7','8','9','156','576','1713','2976','3023','3622','3767','3867'];
const MYSTERY_IMAGE = 'https://ipfs.io/ipfs/Qme4RRP6Q5iWmjnwoqiY2xRdx9fc1cPdht9CA9JYQg8JEH';
const MACC_ADDRESS = process.env.NEXT_PUBLIC_MACC_ADDRESS!;

type SaleState = {
  saleFreeWhitelistActive: boolean;
  saleWhitelistActive: boolean;
  publicSaleActive: boolean;
  serumMutationActive: boolean;
  apesMinted: bigint;
  wlPrice: bigint;
  currentPrice: bigint;
  remainingSaleTime: bigint;
};

function processErrorMessage(err: any): string {
  const msg = err?.message || err?.reason || String(err);
  const endIndex = msg.search('{');
  if (endIndex === -1) return 'Insufficient Funds to Mint.';
  const errMessage = msg.substring(0, endIndex);
  const execution = 'execution reverted: ';
  const executionIndex = errMessage.indexOf(execution);
  if (executionIndex === -1) return errMessage;
  return errMessage.slice(executionIndex + execution.length);
}

function isPositiveInteger(n: string) {
  return (Number(n) >>> 0) === parseFloat(n);
}

export default function MACCPage() {
  const { account, signer, isConnected, connectWallet } = useWallet();
  const [feedback, setFeedback] = useState('');
  const [mintingNft, setMintingNft] = useState(false);
  const [apeSelection, setApeSelection] = useState<string | null>(null);
  const [mintQuantity, setMintQuantity] = useState(1);
  const [rankSelection, setRankSelection] = useState<string | null>(null);
  const [rankToShow, setRankToShow] = useState<string | null>(null);
  const [rankImageUrl, setRankImageUrl] = useState('');
  const [saleState, setSaleState] = useState<SaleState | null>(null);

  const fetchSaleState = useCallback(async () => {
    if (!signer) return;
    try {
      const contract = getMACCContract(signer);
      const [
        saleFreeWhitelistActive,
        saleWhitelistActive,
        publicSaleActive,
        serumMutationActive,
        apesMinted,
        wlPrice,
      ] = await Promise.all([
        contract.saleFreeWhitelistActive(),
        contract.saleWhitelistActive(),
        contract.publicSaleActive(),
        contract.serumMutationActive(),
        contract.apesMinted(),
        contract.WL_PRICE(),
      ]);

      let currentPrice = 0n;
      let remainingSaleTime = 0n;
      if (publicSaleActive) {
        [currentPrice, remainingSaleTime] = await Promise.all([
          contract.getMintPrice(),
          contract.getRemainingSaleTime(),
        ]);
      }

      setSaleState({
        saleFreeWhitelistActive,
        saleWhitelistActive,
        publicSaleActive,
        serumMutationActive,
        apesMinted,
        wlPrice,
        currentPrice,
        remainingSaleTime,
      });
    } catch (e) {
      console.error('Failed to fetch sale state:', e);
    }
  }, [signer]);

  useEffect(() => {
    if (isConnected && signer) fetchSaleState();
  }, [isConnected, signer, fetchSaleState]);

  async function getProof(address: string, wlType: string) {
    const res = await fetch('/api/proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, wlType }),
    });
    return res.json();
  }

  async function claimToken(address: string, token: number) {
    await fetch('/api/claim-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, token: token.toString() }),
    });
  }

  async function setRankStateValues(tokenId: string) {
    setRankSelection(tokenId);
    if (!tokenId) {
      setRankToShow(null);
      setRankImageUrl('');
      return;
    }
    try {
      const [rankRes, metaRes] = await Promise.all([
        fetch(`/api/macc/ranks/${tokenId}`),
        fetch(`/api/metadata/${tokenId}`),
      ]);
      const rankData = await rankRes.json();
      const metaData = await metaRes.json();
      setRankToShow(rankData.rank);
      setRankImageUrl(metaData.image_url);
    } catch {
      setRankToShow('');
      setRankImageUrl('');
    }
  }

  const freeWhitelistMint = async (numMints: number) => {
    if (!signer || !account) return;
    setFeedback('Minting your MACC...');
    setMintingNft(true);
    try {
      const contract = getMACCContract(signer);
      const wlFreeProof = await getProof(account, 'FREE');
      const wlFreeMultiProof = await getProof(account, 'FREE_MULTI');
      await contract.mintFreeWhitelist.staticCall(numMints, wlFreeProof, wlFreeMultiProof, { from: account });
      const tx = await contract.mintFreeWhitelist(numMints, wlFreeProof, wlFreeMultiProof);
      await tx.wait();
      setFeedback('Congratulations and welcome to the Mutant Ape Country Club!');
      fetchSaleState();
    } catch (err: any) {
      setFeedback(processErrorMessage(err));
    }
    setMintingNft(false);
  };

  const whitelistMint = async (numMints: number) => {
    if (!signer || !account) return;
    setFeedback('Minting your MACC...');
    setMintingNft(true);
    try {
      const contract = getMACCContract(signer);
      const wlProof = await getProof(account, 'WL');
      const wlMultiProof = await getProof(account, 'MULTI');
      const cost = saleState!.wlPrice * BigInt(numMints);
      await contract.mintWhitelist.staticCall(numMints, wlProof, wlMultiProof, { value: cost, from: account });
      const tx = await contract.mintWhitelist(numMints, wlProof, wlMultiProof, { value: cost });
      await tx.wait();
      setFeedback('Congratulations and welcome to the Mutant Ape Country Club!');
      fetchSaleState();
    } catch (err: any) {
      setFeedback(processErrorMessage(err));
    }
    setMintingNft(false);
  };

  const dutchAuctionMint = async (numMints: number) => {
    if (!signer || !account) return;
    setFeedback('Minting your MACC...');
    setMintingNft(true);
    try {
      const contract = getMACCContract(signer);
      const price = await contract.getMintPrice();
      const cost = price * BigInt(numMints) + 20000n;
      await contract.mintMutants.staticCall(numMints, { value: cost, from: account });
      const tx = await contract.mintMutants(numMints, { value: cost });
      await tx.wait();
      setFeedback('Congratulations and welcome to the Mutant Ape Country Club!');
      fetchSaleState();
    } catch (err: any) {
      const prettyCost = ethers.formatEther(saleState?.currentPrice ?? 0n);
      setFeedback(processErrorMessage(err) + ` The price to mint ${numMints} mutants is ${prettyCost}ETH.`);
    }
    setMintingNft(false);
  };

  const mutateGrandpa = async (serumId: string, apeId: string) => {
    if (!signer || !account) return;
    setFeedback('Mutating your GACC...');
    setMintingNft(true);
    try {
      const contract = getMACCContract(signer);
      const mutantId = parseInt(apeId) * 2 + parseInt(serumId) + 4999;
      await contract.mutateApeWithSerum.staticCall(serumId, apeId, { from: account });
      const tx = await contract.mutateApeWithSerum(serumId, apeId);
      await tx.wait();
      await claimToken(account, mutantId);
      setFeedback(`Congratulations on mutating your Grandpa! Your Mutant's ID is ${mutantId}.`);
      fetchSaleState();
    } catch (err: any) {
      setFeedback(processErrorMessage(err));
    }
    setMintingNft(false);
  };

  const mutateLegendary = async (apeId: string) => {
    if (!signer || !account) return;
    setFeedback('Mutating your Legendary GACC...');
    setMintingNft(true);
    try {
      const contract = getMACCContract(signer);
      const mutantId = parseInt(apeId) * 2 + 1 + 4999;
      await contract.mutateApeWithoutSerum.staticCall(apeId, { from: account });
      const tx = await contract.mutateApeWithoutSerum(apeId);
      await tx.wait();
      await claimToken(account, mutantId);
      setFeedback(`Congratulations on mutating your legendary Grandpa! Your Mutant's ID is ${mutantId}.`);
      fetchSaleState();
    } catch (err: any) {
      setFeedback(processErrorMessage(err));
    }
    setMintingNft(false);
  };

  const handleMint = (serumId: string | null = null, apeId: string | null = null, numMints: number | null = null) => {
    if (!saleState) return;
    if (saleState.saleFreeWhitelistActive && numMints) freeWhitelistMint(numMints);
    else if (saleState.saleWhitelistActive && numMints) whitelistMint(numMints);
    else if (saleState.publicSaleActive && numMints) dutchAuctionMint(numMints);
    else if (saleState.serumMutationActive && apeId) {
      if (!serumId && LEGENDARIES.includes(apeId)) mutateLegendary(apeId);
      else if (serumId) mutateGrandpa(serumId, apeId);
    }
  };

  const getLabels = () => {
    if (!saleState) return { title: 'MINT A MUTANT', subtitle: 'Connect your wallet to mint a MACC.', info: '' };
    if (saleState.saleFreeWhitelistActive) return {
      title: 'MINT A MUTANT',
      subtitle: `Mutant Grandpas remaining: ${5000 - Number(saleState.apesMinted)}`,
      info: 'Free Whitelist Minting Status: Open',
    };
    if (saleState.saleWhitelistActive) return {
      title: 'MINT A MUTANT',
      subtitle: `Mutant Grandpas remaining: ${5000 - Number(saleState.apesMinted)}`,
      info: 'Whitelist Minting Status: Open',
    };
    if (saleState.publicSaleActive) {
      const remaining = new Date(Number(saleState.remainingSaleTime) * 1000).toISOString().substring(11, 19);
      const price = ethers.formatEther(saleState.currentPrice);
      return {
        title: 'MINT A MUTANT',
        subtitle: `Mutant Grandpas remaining: ${5000 - Number(saleState.apesMinted)}`,
        info: `Price: ${Number(price).toFixed(3)}E | Time remaining: ${remaining}`,
      };
    }
    if (saleState.serumMutationActive) return {
      title: 'MUTATE A GRANDPA APE',
      subtitle: '',
      info: '',
    };
    return { title: '', subtitle: '', info: '' };
  };

  const labels = getLabels();

  const renderMintControls = () => {
    if (!isConnected || !saleState) {
      return (
        <div className="flex justify-center">
          <button className="bayc-button" onClick={connectWallet}>
            CONNECT WALLET
          </button>
        </div>
      );
    }

    if (saleState.saleFreeWhitelistActive || saleState.saleWhitelistActive) {
      return (
        <div className="flex justify-center">
          <form onSubmit={(e) => { e.preventDefault(); handleMint(null, null, mintQuantity); }}>
            <div className="mb-4">
              <input
                type="range"
                min="1"
                max="5"
                value={mintQuantity}
                onChange={(e) => setMintQuantity(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="block text-center text-xl font-bold">{mintQuantity}</span>
            </div>
            <button type="submit" disabled={mintingNft} className="bayc-button">
              Mint
            </button>
          </form>
        </div>
      );
    }

    if (saleState.publicSaleActive) {
      return (
        <div className="flex justify-center">
          <form onSubmit={(e) => { e.preventDefault(); handleMint(null, null, mintQuantity); }}>
            <div className="mb-2 text-center text-sm">{labels.info}</div>
            <div className="mb-4">
              <input
                type="range"
                min="1"
                max="20"
                value={mintQuantity}
                onChange={(e) => setMintQuantity(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="block text-center text-xl font-bold">{mintQuantity}</span>
            </div>
            <button type="submit" disabled={mintingNft} className="bayc-button">
              Mint
            </button>
          </form>
        </div>
      );
    }

    if (saleState.serumMutationActive) {
      return (
        <div className="flex justify-center">
          <form onSubmit={(e) => {
            e.preventDefault();
            const serumEl = document.getElementById('serumId') as HTMLSelectElement | null;
            handleMint(serumEl?.value ?? null, apeSelection);
          }}>
            <div className="mb-4">
              <label className="block mb-1 font-bold">Enter Ape ID to Mutate</label>
              <input
                className="mint-input"
                onChange={(e) => setApeSelection(e.target.value)}
              />
            </div>
            {apeSelection && !LEGENDARIES.includes(apeSelection) && (
              <div className="mb-4 serum-mutate-select">
                <label className="block mb-1 font-bold">Select Serum</label>
                <select id="serumId" className="mint-input p-2 w-full">
                  <option value="1">M1 Serum</option>
                  <option value="2">M2 Serum</option>
                  <option value="69">M3 Serum</option>
                </select>
              </div>
            )}
            <button type="submit" disabled={mintingNft} className="bayc-button">
              Mutate
            </button>
          </form>
        </div>
      );
    }

    return <div className="flex justify-center text-2xl font-bold">MINT SOLD OUT!</div>;
  };

  return (
    <div className="bg-black min-h-screen">
      <Navbar variant="dark" />

      {/* Cover Image */}
      <div className="common-container px-4">
        <img src="/assets/images/MACC_COVER.png" className="w-full" alt="MACC Cover" />
      </div>

      {/* Gray Divider */}
      <div className="px-4 mt-6 mb-6">
        <hr className="gray-line" />
      </div>

      {/* Mint Card */}
      <div className="common-container px-4">
        <div className="flex justify-center mb-10">
          <div className="border border-[#3b3b3b] rounded p-6 w-full max-w-xl">
            <h2 className="mint-title text-center text-2xl mb-2">{labels.title}</h2>
            <hr className="gray-line mb-4" />
            {isConnected && saleState ? (
              <p className="mint-subtitle mb-4">{labels.subtitle}</p>
            ) : (
              <p className="text-center mb-4">Connect your wallet to mint a MACC.</p>
            )}
            {renderMintControls()}
            {feedback && <div className="mint-feedback mt-4 text-sm font-bold">{feedback}</div>}
          </div>
        </div>
      </div>

      {/* Gray Divider */}
      <div className="px-4 mb-6">
        <hr className="gray-line" />
      </div>

      {/* Welcome Section */}
      <div className="common-container px-4 mb-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-7/12">
            <h1 className="common-title mb-4">WELCOME TO THE<br />MUTANT APE COUNTRY CLUB</h1>
            <p className="common-p mb-4">
              The Mutant Ape Country Club (&ldquo;MACC&rdquo;) is a collection of up to 10,000 Mutant Ape NFTs that can only be created by exposing an existing Grandpa Ape to a vial of MUTANT SERUM or by minting a Mutant Ape in the public sale.
            </p>
            <p className="common-p">
              The MACC is a way to reward our grandpa ape holders with an entirely new NFT, a &ldquo;mutant&rdquo; version of their grandpa, while also allowing newcomers into the GACC NFT blockchain ecosystem at a lower tier of membership.
            </p>
          </div>
          <div className="lg:w-5/12 grid grid-cols-2 gap-2">
            <img src="/assets/images/ASTRONAUT.jpg" alt="mutant-1" />
            <img src="/assets/images/SUSHI.jpg" alt="mutant-2" />
            <img src="/assets/images/RAINBOW_GRILL.jpg" alt="mutant-3" />
            <img src="/assets/images/deathbot.jpg" alt="mutant-4" />
          </div>
        </div>
      </div>

      {/* Rarity Lookup */}
      <div className="common-container px-4 mb-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-7/12">
            <h2 className="common-sub-title bayc-color mb-2">OFFICIAL RARITY</h2>
            <p className="common-p mb-4">
              Each Mutant Grandpa is unique and programmatically generated from an impossible amount of traits. All mutant grandpas are insane, but some are technically rarer than others. Use the following tool to lookup the official rarity ranking of a MACC.
            </p>
            <div>
              <label className="font-bold block mb-2">Lookup Rarity</label>
              <input
                placeholder="1"
                onChange={(e) => setRankStateValues(e.target.value)}
              />
            </div>
          </div>
          <div className="lg:w-5/12 flex items-center justify-center">
            {rankSelection && isPositiveInteger(rankSelection) && rankToShow && rankImageUrl ? (
              <div className="relative">
                <img className="w-full" src={rankImageUrl} alt="MACC" />
                <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 text-sm">
                  Rank #{rankToShow}
                </span>
              </div>
            ) : (
              <img className="w-full" src={MYSTERY_IMAGE} alt="mystery token" />
            )}
          </div>
        </div>
      </div>

      {/* Buy a MACC Banner */}
      <div className="common-container px-4 mb-10">
        <div className="bayc-bg p-6 buy-token-container">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <h3 className="buy-ape-title lg:w-1/4" id="buy-a-macc">BUY A MACC</h3>
            <p className="lg:w-5/12">To get your Mutant Grandpa Ape, check out the collection on OpenSea, or mutate a GACC using a serum.</p>
            <div className="lg:w-1/4 lg:text-right">
              <a href="https://opensea.io/collection/mutantapecountryclub" target="_blank" rel="noopener noreferrer">
                <button className="mint py-2 px-6 font-bold cursor-pointer">VISIT OPENSEA</button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Gray Divider */}
      <div className="px-4 mb-6">
        <hr className="gray-line" />
      </div>

      {/* Serums Section */}
      <div className="common-container px-4 mb-10">
        <h2 className="common-title mb-4">SERUMS <span className="bayc-color">(FOR GACC MEMBERS)</span></h2>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-7/12">
            <p className="common-p mb-4">One way to create a MACC is when a Grandpa Ape ingests a vial of mutant serum. There are three tiers of mutant serum vials: M1, M2, and Mega Mutant (M3).</p>
            <p className="common-p mb-4">If a Grandpa Ape ingests an M1 or M2 serum, the resulting MUTANT will retain traits of the original ape.</p>
            <p className="common-p">If a Grandpa Ape ingests an M3 serum? Who knows...</p>
          </div>
          <div className="lg:w-5/12">
            <p className="common-sub-p italic">
              <span className="bayc-color font-bold">NOTE:</span> Serum vials are burned upon use, and a Grandpa Ape can only ingest a serum of a given vial-type once. This means that any given Grandpa Ape can be exposed to an M1, M2, or M3 vial, resulting in three different mutations.
            </p>
          </div>
        </div>

        {/* Serum Images with Scroll Arrows */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-2 mt-8">
          <div className="text-center">
            <img className="w-48 mx-auto" src="/assets/images/kuchuya.jpg" alt="Kuchuya" />
            <p className="kitten-caption mt-2">Kuchuya</p>
          </div>

          <div className="flex flex-col items-center justify-center px-4 py-2 lg:py-0">
            <div className="m_scroll_arrows_down"></div>
            <div className="m_scroll_arrows_down second"></div>
            <div className="m_scroll_arrows_down third"></div>
          </div>

          <div className="text-center">
            <img className="w-48 mx-auto" src="/assets/images/kuchuya_m1.png" alt="M1 Kuchuya" />
            <p className="kitten-caption mt-2">M1 Kuchuya</p>
          </div>

          <div className="flex flex-col items-center justify-center px-4 py-2 lg:py-0">
            <div className="m_scroll_arrows_down"></div>
            <div className="m_scroll_arrows_down second"></div>
            <div className="m_scroll_arrows_down third"></div>
          </div>

          <div className="text-center">
            <img className="w-48 mx-auto" src="/assets/images/kuchuya_m2.png" alt="M2 Kuchuya" />
            <p className="kitten-caption mt-2">M2 Kuchuya</p>
          </div>
        </div>
      </div>

      {/* Gray Divider */}
      <div className="px-4 mb-6">
        <hr className="gray-line" />
      </div>

      {/* Distribution & Pricing */}
      <div className="common-container px-4 mb-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-5/12">
            <img src="/assets/images/serum.gif" className="w-full" alt="serum" />
          </div>
          <div className="lg:w-7/12">
            <h2 className="common-title mb-4">DISTRIBUTION &amp; PRICING</h2>
            <p className="common-p mb-4">A total of 5,000 Mutant Serums have been airdropped to all GACC token holders.</p>
            <p className="common-p mb-4">2,500 Mutant Apes were reserved for Whitelist Wallets. After the Whitelist Mint period closed, 2,500 more were available via a public Dutch Auction.</p>
            <p className="common-p">Now that the mutants are revealed, GACC members are able to mutate their apes with serums here on the site.</p>
          </div>
        </div>
      </div>

      {/* Buy a Serum Banner */}
      <div className="common-container px-4 mb-10">
        <div className="bayc-bg p-6 buy-token-container">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <h3 className="buy-ape-title lg:w-1/4" id="buy-a-serum">BUY A SERUM</h3>
            <p className="lg:w-5/12">The serum snapshot and airdrop has ended. To get your M1, M2, or Mega Serum, check out the collection on OpenSea.</p>
            <div className="lg:w-1/4 lg:text-right">
              <a href="https://opensea.io/collection/grandpa-ape-serum" target="_blank" rel="noopener noreferrer">
                <button className="mint py-2 px-6 font-bold cursor-pointer">VISIT OPENSEA</button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Gray Divider */}
      <div className="px-4 mb-6">
        <hr className="gray-line" />
      </div>

      {/* Mutation Section */}
      <div className="common-container px-4 mb-10">
        <h2 className="common-title mb-4">MUTATION <span className="bayc-color">(FOR GACC MEMBERS)</span></h2>
        <p className="common-p mb-4">
          GACC token holders are able to apply their serums to their Grandpa Apes. Applying a serum will burn that serum and result in a MACC NFT which may retain aspects of the original Grandpa Ape. The Grandpa Ape NFT will not be harmed.
        </p>
        <p className="common-p font-bold mb-4">THERE IS NO SET TIME LIMIT FOR APPLYING SERUMS.</p>
        <p className="common-p">Remember, a Grandpa Ape can only be mutated via a vial of a certain type once.</p>
      </div>

      {/* Smart Contract Address */}
      <div className="common-container px-4 mb-10 text-center">
        <p className="break-all">
          <span className="font-bold">VERIFIED SMART CONTRACT ADDRESS: </span>
          <a
            href="https://etherscan.io/address/0xAD0db7368CDFbd3153F7dfaCA51A78Eeb39F6d71"
            className="bayc-color hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            0xAD0db7368CDFbd3153F7dfaCA51A78Eeb39F6d71
          </a>
        </p>
      </div>

      {/* Footer */}
      <footer className="common-container px-4 pt-8 pb-6">
        <hr className="line" />
        <div className="flex justify-center mt-6">
          <img src="/assets/images/GACC_WHITE_2.png" alt="GACC Logo" className="footer-logo" />
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <a href="https://discord.gg/8uuhkZ2TA2" target="_blank" rel="noopener noreferrer" className="social-icon text-2xl">
            <i className="fa fa-commenting" aria-hidden="true"></i>
          </a>
          <a href="https://twitter.com/GrandpaApeCC" target="_blank" rel="noopener noreferrer" className="social-icon text-2xl">
            <i className="fa fa-twitter" aria-hidden="true"></i>
          </a>
          <a href="https://www.instagram.com/grandpaapecountryclubofficial" target="_blank" rel="noopener noreferrer" className="social-icon text-2xl">
            <i className="fa fa-instagram" aria-hidden="true"></i>
          </a>
          <a href="https://opensea.io/collection/grandpa-ape-country-club" target="_blank" rel="noopener noreferrer" className="social-icon text-2xl">
            <i className="fa fa-anchor" aria-hidden="true"></i>
          </a>
          <a href="https://etherscan.io/address/0xa65b0dbe0992ebe8c68a08b8e9b58892b6248f68" target="_blank" rel="noopener noreferrer" className="social-icon text-2xl">
            <i className="fa fa-diamond" aria-hidden="true"></i>
          </a>
        </div>
        <div className="text-center mt-4">
          <p className="copyright">&copy; 2022 Grandpa Ape Country Club LLC</p>
        </div>
        <hr className="last-line mt-4" />
      </footer>
    </div>
  );
}
