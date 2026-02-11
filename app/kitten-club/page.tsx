'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { getGAKCContract, getLunagemContract, getReadProvider } from '@/lib/blockchain/contracts';

const KITTEN_ADDRESS = process.env.NEXT_PUBLIC_KITTEN_ADDRESS!;
const LUNAGEM_ADDRESS = process.env.NEXT_PUBLIC_LUNAGEM_ADDRESS!;
const GACC_ADDRESS = process.env.NEXT_PUBLIC_GACC_ADDRESS!;
const UNREVEALED_IMAGE = 'https://gakc.s3.amazonaws.com/unrevealed_kitten.png';
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!;

function processErrorMessage(err: any): string {
  const msg = err?.message || err?.reason || String(err);
  const endIndex = msg.search('{');
  if (endIndex === -1) return 'Insufficient Funds to Mint.';
  const errMessage = msg.substring(0, endIndex);
  const execution = 'execution reverted: ';
  const executionIndex = msg.indexOf(execution);
  if (executionIndex === -1) return errMessage.replace('Internal JSON-RPC error.', '');
  return msg.slice(executionIndex + execution.length).replace('Internal JSON-RPC error.', '').replace('"', '').replace('}', '');
}

function isPositiveInteger(n: string) {
  return (Number(n) >>> 0) === parseFloat(n);
}

function onlyUnique<T>(value: T, index: number, array: T[]) {
  return array.indexOf(value) === index;
}

export default function KittenClubPage() {
  const { account, signer, isConnected, connectWallet } = useWallet();
  const [feedback, setFeedback] = useState('');
  const [callingKitten, setCallingKitten] = useState(false);
  const [lunagemInput, setLunagemInput] = useState('');
  const [rankSelection, setRankSelection] = useState<string | null>(null);
  const [rankToShow, setRankToShow] = useState<string | null>(null);
  const [rankImageUrl, setRankImageUrl] = useState('');
  const [kittenCallActive, setKittenCallActive] = useState(false);

  const fetchKittenState = useCallback(async () => {
    if (!signer) return;
    try {
      const contract = getGAKCContract(signer);
      const active = await contract.callIsActive();
      setKittenCallActive(active);
    } catch (e) {
      console.error('Failed to fetch kitten state:', e);
    }
  }, [signer]);

  useEffect(() => {
    if (isConnected && signer) fetchKittenState();
  }, [isConnected, signer, fetchKittenState]);

  async function setRankStateValues(tokenId: string) {
    setRankSelection(tokenId);
    if (!tokenId) {
      setRankToShow(null);
      setRankImageUrl('');
      return;
    }
    try {
      const [rankRes, metaRes] = await Promise.all([
        fetch(`/api/kittens/ranks/${tokenId}`),
        fetch(`/api/kittens/metadata/${tokenId}`),
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

  async function getOwnedLunagems(addresses: string[]): Promise<number[]> {
    const results: number[] = [];
    for (const address of addresses) {
      let pageKey: string | undefined = undefined;
      let isFirst = true;
      while (isFirst || pageKey) {
        isFirst = false;
        const params: any = {
          owner: address,
          contractAddresses: [LUNAGEM_ADDRESS],
          pageSize: 100,
          withMetadata: false,
        };
        if (pageKey) params.pageKey = pageKey;
        const url: string = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTsForOwner?` +
          `owner=${address}&contractAddresses[]=${LUNAGEM_ADDRESS}&pageSize=100&withMetadata=false` +
          (pageKey ? `&pageKey=${pageKey}` : '');
        const res = await fetch(url);
        const data = await res.json();
        for (const nft of data.ownedNfts || []) {
          results.push(parseInt(nft.tokenId));
        }
        pageKey = data.pageKey;
        await new Promise(r => setTimeout(r, 300));
      }
    }
    return results;
  }

  function getKittenIdsFromReceipt(receipt: ethers.TransactionReceipt): number[] {
    const kittenIds: number[] = [];
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === KITTEN_ADDRESS.toLowerCase()) {
        try {
          const iface = new ethers.Interface(['event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)']);
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed && parsed.name === 'Transfer') {
            kittenIds.push(Number(parsed.args.tokenId));
          }
        } catch {}
      }
    }
    return kittenIds;
  }

  async function revealKittenMetadata(address: string, receipt: ethers.TransactionReceipt) {
    const kittenIds = getKittenIdsFromReceipt(receipt);
    const res = await fetch('/api/kittens/claim-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, tokens: kittenIds }),
    });
    return res;
  }

  const callKittens = async (lunagemIdsRaw: string | null, pullIds: boolean) => {
    if (!signer || !account) return;
    setFeedback('Kitten call vetting in progress...');
    setCallingKitten(true);

    let lunagemIds: number[];
    const vault = '0x0000000000000000000000000000000000000000';
    const wallets = [account];

    if (pullIds) {
      lunagemIds = await getOwnedLunagems(wallets);
      lunagemIds = lunagemIds.filter(onlyUnique);
      setFeedback(`Found ${lunagemIds.length} Lunagem(s) to call Kittens with...`);
    } else {
      if (!lunagemIdsRaw) {
        setFeedback('Lungem IDs are required...');
        setCallingKitten(false);
        return;
      }
      lunagemIds = lunagemIdsRaw.split(',').map(Number).filter(onlyUnique);
    }

    if (lunagemIds.length === 0) {
      setFeedback(pullIds ? 'All of your Lunagems have been used!' : 'Lungem IDs are required...');
      setCallingKitten(false);
      return;
    }

    if (lunagemIds.some(e => e < 0) || lunagemIds.some(e => e > 2221)) {
      setFeedback('Lungem IDs need to be between 0 and 2221');
      setCallingKitten(false);
      return;
    }

    setFeedback('Performing the ancient Kitten Call...');
    try {
      const contract = getGAKCContract(signer);
      await contract.callKitten.staticCall(vault, lunagemIds, { from: account });
      const tx = await contract.callKitten(vault, lunagemIds);
      const receipt = await tx.wait();

      setFeedback('Flipping your new kitten metadata!...');
      const transactionHash = receipt!.hash;

      try {
        const response = await revealKittenMetadata(account, receipt!);
        if (response.status === 200) {
          setFeedback(`Congratulations, you have successfully called ${lunagemIds.length} GAKC kitten(s)!`);
        } else {
          setFeedback(
            `Congratulations, you have successfully called ${lunagemIds.length} GAKC kitten(s)! We had an issue flipping metadata. Please reach out to Discord support with transaction hash: ${transactionHash}.`
          );
        }
      } catch {
        setFeedback(
          `Congratulations, you have successfully called ${lunagemIds.length} GAKC kitten(s)! We had an issue flipping metadata. Please reach out to Discord support with transaction hash: ${transactionHash}.`
        );
      }
      fetchKittenState();
    } catch (err: any) {
      setFeedback(processErrorMessage(err));
    }
    setCallingKitten(false);
  };

  const renderCallControls = () => {
    if (!isConnected) {
      return (
        <div className="flex justify-center">
          <button
            className="bg-[#977039] text-white font-bold py-3 px-8 border-b-4 border-r-4 border-black hover:opacity-90"
            onClick={connectWallet}
          >
            CONNECT WALLET
          </button>
        </div>
      );
    }

    if (kittenCallActive) {
      return (
        <div className="flex justify-center">
          <form onSubmit={(e) => { e.preventDefault(); callKittens(lunagemInput, false); }}>
            <div className="mb-4">
              <label className="block mb-1 font-bold">Enter Lunagem IDs to Call a Kitten</label>
              <input
                className="w-full p-2 border-2 border-black bg-[#977039] text-white text-center placeholder-white/60"
                placeholder="1, 2, 3"
                onChange={(e) => setLunagemInput(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={callingKitten}
                className="bg-[#977039] text-white font-bold py-3 px-6 border-b-4 border-r-4 border-black hover:opacity-90 disabled:opacity-50"
              >
                Call
              </button>
              <button
                type="button"
                disabled={callingKitten}
                onClick={() => callKittens(null, true)}
                className="bg-[#977039] text-white font-bold py-3 px-6 border-b-4 border-r-4 border-black hover:opacity-90 disabled:opacity-50"
              >
                Call All In Wallet
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div className="text-center">
        <p className="mb-3">Kitten calling has not yet commenced. Check out the Lunagem collection on OpenSea, you&apos;ll need one to call a Kitten.</p>
        <a href="https://opensea.io/collection/lunagems" target="_blank" rel="noopener noreferrer">
          <button className="bg-[#977039] text-white font-bold py-3 px-6 border-b-4 border-r-4 border-black hover:opacity-90">
            BUY A LUNAGEM ON OPENSEA
          </button>
        </a>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white bg-black bg-cover bg-center" style={{ backgroundImage: 'url(/assets/images/starry.jpg)' }}>
      <div className="container mx-auto px-4">
        <div className="mb-8 lg:mb-10">
          <img src="https://gaccdiscordimages.s3.amazonaws.com/gacc_world.png" className="w-full" alt="GAKC World" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          <div className="lg:w-7/12">
            <h1 className="text-3xl font-bold mb-3">THE<br />GRANDPA APE KITTEN CLUB</h1>
            <p className="mb-4">
              On their third year of adventuring through the depths of the unexplored world, the apes discovered an alien utopia of wonders. A world filled with adorable kittens of all shapes and colors, with magical powers and hearts that instantly filled their longing souls with warmth.
            </p>
            <p className="mb-4">
              The kittens proved to be kind and generous, immediately taking to the wandering apes. The apes shared their stories to thousands of perked up ears.
            </p>
            <p>
              Together the apes and kittens felt renewed. Together the Grandpas and the kittens built the Grandpa Ape Kitten Club.
            </p>
          </div>
          <div className="lg:w-5/12">
            <img src="/assets/images/kitten_promo_1.jpg" className="w-full rounded" alt="kitten promo" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          <div className="lg:w-7/12">
            <h2 className="text-xl font-bold italic text-[#bfc500] mb-2">LUNAGEMS</h2>
            <p className="mb-4">
              Upon returning to the ape country, the adventurers and kittens inspired apes to explore the unknown. However, it turned out that happening upon the Land of Kittens was not so simple.
            </p>
            <p className="mb-4">
              It was then when the kittens taught the apes how to summon a kitten from the land. An ancient call, an enchantment of sorts, which seems unworldly to the apes, would summon a kitten to their side. To work, a unique resource, found deep within the mountains, was needed: a Lunagem.
            </p>
            <p className="mb-4">
              It was this day, when apes and kittens were forever bounded — their worlds united and the future looked bright.
            </p>
            <p>The laboratory on Mount Naro heard their calls...</p>
          </div>
          <div className="lg:w-5/12 flex items-center order-first lg:order-none">
            <img src="https://gaccdiscordimages.s3.amazonaws.com/lunagem_closeup.png" className="w-full" alt="lunagem" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          <div className="lg:w-7/12">
            <h2 className="text-xl font-bold italic text-[#bfc500] mb-2">LUNAGEM DISTRIBUTION &amp; PRICING</h2>
            <p className="mb-4">
              For a limited time, each and every club member will be able to mine a Lunagem NFT from the Grandpa Ape Kitten Club. Mining the token is free; you&apos;ll only have to pay gas.
            </p>
            <p className="mb-4">
              In order to mine a Lunagem, one must have a Grandpa Ape in their wallet. You can mine one Lunagem NFT for each Grandpa Ape that you own.
            </p>
            <p>
              The ending supply of Lunagems, with a maximum of 5,000, will determine the maximum supply of Grandpa Ape Kittens.
            </p>
          </div>
          <div className="lg:w-5/12">
            <img src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2hxdTh5dThvMmE2NzB6NDZ1cm4yNzN3b2x2NjlnY3dkM2hoM24xYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IsecmpZJhuFBA9ZXk8/source.gif" className="w-full" alt="lunagem animation" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          <div className="lg:w-7/12">
            <h2 className="text-xl font-bold italic text-[#bfc500] mb-2">THE GRANDPA APE KITTEN CLUB SPECS</h2>
            <p className="mb-4">
              There are up to 5,000 total Grandpa Ape Kitten Club (GAKC) NFTs. After the Lunagem mining phase, the kitten calling phase will commence. Using a Lunagem will destroy the Lunagem, burning it from the collection.
            </p>
            <p>
              Kittens come with a variety of traits, some rarer than others. A few lucky Lunagem callers will make contact with a legendary kitten, mystical and ancient.
            </p>
          </div>
          <div className="lg:w-5/12 flex items-center order-first lg:order-none">
            <img src="/assets/images/kitten_promo_2.jpg" className="w-full rounded" alt="kitten promo 2" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          <div className="lg:w-7/12">
            <h2 className="text-xl font-bold italic text-[#bfc500] mb-2">OFFICIAL RARITY</h2>
            <p className="mb-4">
              Each Kitten is unique and programmatically generated from an impossible amount of traits. All kittens are adorable, but some are rarer than others. Use the following tool to lookup the official rarity ranking of a GAKC kitten.
            </p>
            <div>
              <label className="font-bold block mb-2">Lookup Rarity</label>
              <input
                className="w-full p-2 border border-gray-400 text-center text-black"
                placeholder="1"
                onChange={(e) => setRankStateValues(e.target.value)}
              />
            </div>
          </div>
          <div className="lg:w-5/12 flex items-center justify-center">
            {rankSelection && isPositiveInteger(rankSelection) && rankToShow && rankImageUrl ? (
              <div className="relative">
                <img className="w-full rounded" src={rankImageUrl} alt="Kitten" />
                <span className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 text-sm rounded">
                  Rank #{rankToShow}
                </span>
              </div>
            ) : (
              <img className="w-full rounded" src={UNREVEALED_IMAGE} alt="mystery token" />
            )}
          </div>
        </div>

        <div className="mb-10">
          <div className="bg-[#977039] p-6 rounded flex flex-col lg:flex-row items-center gap-4">
            <h3 className="text-xl font-bold lg:w-1/4" id="buy-a-gakc">BUY A GAKC or LUNAGEM</h3>
            <p className="lg:w-5/12">To get your Kitten, buy a Lunagem on OpenSea to call a kitten, or buy one directly on OpenSea.</p>
            <div className="lg:w-1/4 flex gap-2 lg:justify-end">
              <a href="https://opensea.io/collection/grandpaapekittenclub" target="_blank" rel="noopener noreferrer">
                <button className="bg-black text-white font-bold py-2 px-4 border-b-4 border-r-4 border-gray-700 hover:opacity-90">GAKC</button>
              </a>
              <a href="https://opensea.io/collection/lunagems" target="_blank" rel="noopener noreferrer">
                <button className="bg-black text-white font-bold py-2 px-4 border-b-4 border-r-4 border-gray-700 hover:opacity-90">Lunagems</button>
              </a>
            </div>
          </div>
        </div>

        <hr className="border-gray-600 mb-10" />

        <div className="flex justify-center mb-10">
          <div className="border border-gray-600 rounded p-6 w-full max-w-xl bg-black/50">
            <h2 className="text-center text-2xl font-bold mb-4">
              {kittenCallActive ? 'CALL A KITTEN' : 'GRANDPA APE KITTEN CLUB'}
            </h2>
            <hr className="border-gray-600 mb-4" />
            {isConnected && kittenCallActive ? (
              <p className="text-center mb-4"></p>
            ) : !isConnected ? (
              <p className="text-center mb-4">Connect your wallet to call a Kitten using a Lunagem.</p>
            ) : null}
            {renderCallControls()}
            {feedback && <div className="mt-4 text-center text-sm font-bold">{feedback}</div>}
          </div>
        </div>

        <div className="text-center mb-10">
          <p className="break-all mb-2">
            <span className="font-bold">VERIFIED LUNAGEM SMART CONTRACT ADDRESS: </span>
            <a href="https://etherscan.io/address/0xAAb6E53554e56513FE5825738C950Bd3812B38c6" className="text-[#bfc500] hover:underline" target="_blank" rel="noopener noreferrer">
              0xAAb6E53554e56513FE5825738C950Bd3812B38c6
            </a>
          </p>
          <p className="break-all">
            <span className="font-bold">VERIFIED GAKC SMART CONTRACT ADDRESS: </span>
            <a href="https://etherscan.io/address/0xb73B1335C1f14ECCD0D6787490bCe85e1af62378" className="text-[#bfc500] hover:underline" target="_blank" rel="noopener noreferrer">
              0xb73B1335C1f14ECCD0D6787490bCe85e1af62378
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
