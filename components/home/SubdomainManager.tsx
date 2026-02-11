'use client';

import { useState, useCallback, useEffect } from 'react';
import { Contract, namehash, JsonRpcProvider } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';

const SUBDOMAIN_CLAIMER_ADDRESS = '0x4E82641c6d4f24b066abF6E14DBB498476fcF656';
const RESOLVER = '0xF29100983E058B709F3D539b0c765937B804AC15';
const NAMEWRAPPER_ADDRESS = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401';
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const SUBDOMAIN_CLAIMER_ABI = [
  'function currentLabelOf(address _owner) view returns (string)',
  'function claim(string label)',
  'function release()',
];

const ENS_REGISTRY_ABI = [
  'function resolver(bytes32 node) view returns (address)',
  'function owner(bytes32 node) view returns (address)',
];

const RESOLVER_ABI = [
  'function addr(bytes32 node) view returns (address)',
  'function setAddr(bytes32 node, address addr)',
  'function setAddr(bytes32 node, uint256 coinType, bytes addr)',
];

const NAMEWRAPPER_ABI = [
  'function setResolver(bytes32 node, address resolver)',
];

type SubdomainState = 'NONE' | 'CLAIMED_NO_RESOLVER' | 'RESOLVER_SET_NO_ADDR' | 'FULLY_ACTIVE';

function getReadProvider() {
  return new JsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  );
}

function validateEnsLabel(label: string): { valid: boolean; error?: string } {
  if (!label || label.trim().length === 0) return { valid: false, error: 'Subdomain name cannot be empty' };
  const trimmed = label.trim();
  if (trimmed.length > 63) return { valid: false, error: 'Must be 63 characters or less' };
  if (!/^[a-z0-9-]+$/i.test(trimmed)) return { valid: false, error: 'Only letters, numbers, and hyphens' };
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) return { valid: false, error: 'Cannot start or end with a hyphen' };
  if (trimmed.includes('--')) return { valid: false, error: 'Cannot have consecutive hyphens' };
  if (/^\d+$/.test(trimmed)) return { valid: false, error: 'Cannot be only numbers' };
  return { valid: true };
}

export default function SubdomainManager() {
  const { account, signer, provider, isConnected, connectWallet } = useWallet();

  const [ensName, setEnsName] = useState<string | null>(null);
  const [subdomainInput, setSubdomainInput] = useState('');
  const [currentSubdomain, setCurrentSubdomain] = useState<string | null>(null);
  const [subdomainState, setSubdomainState] = useState<SubdomainState>('NONE');
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState('');
  const [loadingSubdomain, setLoadingSubdomain] = useState(false);
  const [activatingEns, setActivatingEns] = useState(false);

  const getSubdomainState = useCallback(async (label: string, userAccount: string): Promise<SubdomainState> => {
    try {
      const readProvider = getReadProvider();
      const subdomainNode = namehash(`${label}.thegrandpa.eth`);
      const registry = new Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, readProvider);
      const resolverAddr = await registry.resolver(subdomainNode);

      if (!resolverAddr || resolverAddr === ZERO_ADDRESS) return 'CLAIMED_NO_RESOLVER';

      const resolver = new Contract(resolverAddr, ['function addr(bytes32 node) view returns (address)'], readProvider);
      const addr = await resolver.addr(subdomainNode);

      if (!addr || addr === ZERO_ADDRESS) return 'RESOLVER_SET_NO_ADDR';
      if (addr.toLowerCase() === userAccount.toLowerCase()) return 'FULLY_ACTIVE';
      return 'RESOLVER_SET_NO_ADDR';
    } catch {
      return 'CLAIMED_NO_RESOLVER';
    }
  }, []);

  const checkCurrentSubdomain = useCallback(async (userAccount: string) => {
    setLoadingSubdomain(true);
    try {
      const readProvider = getReadProvider();
      const contract = new Contract(SUBDOMAIN_CLAIMER_ADDRESS, SUBDOMAIN_CLAIMER_ABI, readProvider);
      const label = await contract.currentLabelOf(userAccount);
      const labelStr = label ? String(label).trim() : '';

      if (labelStr.length > 0 && labelStr !== 'null' && labelStr !== 'undefined') {
        setCurrentSubdomain(labelStr);
        const state = await getSubdomainState(labelStr, userAccount);
        setSubdomainState(state);
      } else {
        setCurrentSubdomain(null);
        setSubdomainState('NONE');
      }
    } catch {
      setCurrentSubdomain(null);
      setSubdomainState('NONE');
    } finally {
      setLoadingSubdomain(false);
    }
  }, [getSubdomainState]);

  const resolveEnsName = useCallback(async (userAccount: string) => {
    try {
      const readProvider = getReadProvider();
      const name = await readProvider.lookupAddress(userAccount);
      setEnsName(name);
    } catch {
      setEnsName(null);
    }
  }, []);

  useEffect(() => {
    if (account) {
      checkCurrentSubdomain(account);
      resolveEnsName(account);
    }
  }, [account, checkCurrentSubdomain, resolveEnsName]);

  const claimSubdomain = useCallback(async () => {
    if (!signer || !account || !subdomainInput.trim()) return;

    setClaiming(true);
    setClaimStatus('');

    try {
      const label = subdomainInput.trim().toLowerCase();
      const validation = validateEnsLabel(label);
      if (!validation.valid) {
        setClaimStatus(`Error: ${validation.error}`);
        setClaiming(false);
        return;
      }

      const contract = new Contract(SUBDOMAIN_CLAIMER_ADDRESS, SUBDOMAIN_CLAIMER_ABI, signer);
      const tx = await contract.claim(label);
      await tx.wait();

      setClaimStatus(`Success! Subdomain claimed: ${label}.thegrandpa.eth`);
      setSubdomainInput('');
      setTimeout(() => checkCurrentSubdomain(account), 3000);
    } catch (err: any) {
      if (err.message?.includes('Invalid or reserved label')) {
        setClaimStatus(`Error: The subdomain "${subdomainInput.trim()}" is invalid or reserved.`);
      } else {
        setClaimStatus(`Error: ${err.message}`);
      }
    } finally {
      setClaiming(false);
    }
  }, [signer, account, subdomainInput, checkCurrentSubdomain]);

  const activateEns = useCallback(async () => {
    if (!signer || !account || !currentSubdomain) return;

    setActivatingEns(true);
    setClaimStatus('');

    try {
      const subdomainNode = namehash(`${currentSubdomain}.thegrandpa.eth`);
      const readProvider = getReadProvider();
      const registry = new Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, readProvider);
      let resolverAddress = await registry.resolver(subdomainNode);

      const needsResolver = !resolverAddress || resolverAddress === ZERO_ADDRESS || resolverAddress.toLowerCase() !== RESOLVER.toLowerCase();

      if (needsResolver) {
        setClaimStatus('Transaction 1/2: Setting resolver...');
        const nameWrapper = new Contract(NAMEWRAPPER_ADDRESS, NAMEWRAPPER_ABI, signer);
        const setResolverTx = await nameWrapper.setResolver(subdomainNode, RESOLVER);
        await setResolverTx.wait();
        resolverAddress = RESOLVER;
      }

      setClaimStatus(needsResolver ? 'Transaction 2/2: Setting address...' : 'Setting address...');
      const resolver = new Contract(resolverAddress, RESOLVER_ABI, signer);

      try {
        const setAddrTx = await resolver['setAddr(bytes32,address)'](subdomainNode, account);
        await setAddrTx.wait();
      } catch {
        const coinType = 60;
        const addrBytes = account;
        const setAddrTx = await resolver['setAddr(bytes32,uint256,bytes)'](subdomainNode, coinType, addrBytes);
        await setAddrTx.wait();
      }

      setClaimStatus('Success! ENS activated.');
      setTimeout(() => checkCurrentSubdomain(account), 3000);
    } catch (err: any) {
      setClaimStatus(`Error: ${err.message}`);
    } finally {
      setActivatingEns(false);
    }
  }, [signer, account, currentSubdomain, checkCurrentSubdomain]);

  return (
    <section className="px-4 mb-10">
      <h2 className="text-2xl font-bold text-black mb-3">THE GRANDPA SUBDOMAINS</h2>
      <p className="text-black text-base leading-relaxed">
        Claim your <strong className="text-[#977039]">thegrandpa.eth</strong> subdomain! Own a piece of the Grandpa Ape Country Club identity on the Ethereum Name Service (ENS). Your subdomain will be yours forever, letting you show your grandpa pride wherever you go.
      </p>
      <p className="text-black text-base leading-relaxed mt-3">
        Each wallet can claim one subdomain under <strong className="text-[#977039]">thegrandpa.eth</strong>. Once claimed, you can switch to a new name anytime, but your previous subdomain will be released.
      </p>
      <p className="text-black text-base leading-relaxed mt-3">
        Connect your wallet to start! To set your grandpa ENS as your primary name head to the{' '}
        <a
          href="https://app.ens.domains/thegrandpa.eth?tab=subnames"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#977039] underline"
        >
          ENS subdomain page
        </a>{' '}and find yours.
      </p>
      <p className="text-black text-sm mt-4 mb-0">
        <strong className="text-[#977039]">Contract:</strong>{' '}
        <a
          href="https://etherscan.io/address/0x4E82641c6d4f24b066abF6E14DBB498476fcF656"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#977039] underline break-all"
        >
          0x4E82641c6d4f24b066abF6E14DBB498476fcF656
        </a>
      </p>

      <div className="mt-6 max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md border-2 border-[#977039]">
          {!isConnected ? (
            <div className="text-center">
              <button
                type="button"
                onClick={connectWallet}
                className="bg-[#977039] text-[#f9edcd] font-bold py-4 px-8 rounded w-full text-lg"
              >
                CONNECT WALLET
              </button>
              <p className="text-gray-500 text-sm mt-4">Connect to claim your subdomain</p>
            </div>
          ) : (
            <div>
              <div className="mb-5 p-3 bg-[#f9edcd] rounded-lg border border-[#977039]">
                <p className="text-[#977039] text-sm font-bold truncate">
                  Connected Wallet: {ensName || account}
                </p>
              </div>

              {loadingSubdomain ? (
                <div className="bg-[#f9edcd] p-4 rounded-lg mb-5 text-center border-2 border-[#83D8FC]">
                  <p className="text-[#977039] text-sm font-bold">Checking subdomain...</p>
                </div>
              ) : currentSubdomain ? (
                <div>
                  <div className="bg-gradient-to-br from-[#f9edcd] to-[#e8d9b0] p-5 rounded-lg mb-5 text-center border-3 border-[#977039] shadow-md">
                    <p className="text-[#977039] text-sm font-bold uppercase mb-2">Your Subdomain:</p>
                    <p className="text-[#977039] text-2xl font-bold break-words">
                      {currentSubdomain}.thegrandpa.eth
                    </p>
                  </div>

                  {(subdomainState === 'CLAIMED_NO_RESOLVER' || subdomainState === 'RESOLVER_SET_NO_ADDR') && (
                    <div className="mb-5 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-400 text-center">
                      <p className="text-yellow-800 text-sm font-bold mb-3">
                        {subdomainState === 'CLAIMED_NO_RESOLVER'
                          ? 'Your subdomain needs to be activated to resolve to your address.'
                          : 'Your subdomain resolver is set, but address needs to be configured.'}
                      </p>
                      <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-400 text-left">
                        <p className="text-yellow-800 text-sm font-bold mb-2">What to Expect:</p>
                        <ul className="text-yellow-800 text-xs list-disc pl-5 leading-relaxed">
                          {subdomainState === 'CLAIMED_NO_RESOLVER' && (
                            <>
                              <li><strong>Transaction 1:</strong> Set the resolver - tells ENS where to store your address</li>
                              <li><strong>Transaction 2:</strong> Set your address on the resolver - links your subdomain to your wallet</li>
                            </>
                          )}
                          {subdomainState === 'RESOLVER_SET_NO_ADDR' && (
                            <li><strong>Transaction 1:</strong> Set your address on the resolver - links your subdomain to your wallet</li>
                          )}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={activateEns}
                        disabled={activatingEns}
                        className="bg-[#977039] text-[#f9edcd] font-bold py-3 px-6 rounded w-full disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {activatingEns ? 'ACTIVATING ENS...' : 'ACTIVATE ENS'}
                      </button>
                    </div>
                  )}

                  {subdomainState === 'FULLY_ACTIVE' && (
                    <div className="mb-5 p-4 bg-green-50 rounded-lg border-2 border-green-700 text-center">
                      <p className="text-green-700 text-sm font-bold">
                        Your subdomain is fully active and resolving to your address!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#f9edcd] p-4 rounded-lg mb-5 text-center border-2 border-dashed border-[#977039]">
                  <p className="text-gray-500 text-sm italic">Get yo subdomain!</p>
                </div>
              )}

              <div className="mb-5">
                <label className="text-[#977039] font-bold block mb-2">Subdomain Name:</label>
                <input
                  type="text"
                  value={subdomainInput}
                  onChange={(e) => setSubdomainInput(e.target.value)}
                  placeholder={currentSubdomain ? 'Enter new subdomain' : 'Enter subdomain name'}
                  disabled={claiming}
                  className="w-full p-3 rounded-lg border-2 border-[#977039] bg-[#f9edcd] text-black focus:border-[#83D8FC] focus:bg-white transition-all placeholder:text-gray-400"
                />
                <p className="text-[#977039] text-xs mt-2 italic">
                  {currentSubdomain ? 'Enter a new name to switch' : '1-63 characters, no spaces at start/end'}
                </p>
              </div>

              {!currentSubdomain && (
                <div className="mb-5 p-4 bg-blue-50 rounded-lg border-2 border-[#83D8FC]">
                  <p className="text-black text-sm font-bold mb-2">What to Expect:</p>
                  <ul className="text-black text-sm list-disc pl-5 leading-relaxed">
                    <li><strong>Transaction 1:</strong> Claim your subdomain (creates the ENS record)</li>
                    <li><strong>Transaction 2:</strong> Activate ENS - this will set the resolver (if needed) and your address</li>
                  </ul>
                  <p className="text-gray-500 text-xs mt-3 italic">
                    Note: Activation may require 1-2 transactions depending on whether the resolver is already set.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={claimSubdomain}
                disabled={claiming || !subdomainInput.trim()}
                className="bg-[#977039] text-[#f9edcd] font-bold py-4 px-8 rounded w-full text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {claiming ? 'PROCESSING...' : currentSubdomain ? 'SWITCH SUBDOMAIN' : 'CLAIM SUBDOMAIN'}
              </button>

              {claimStatus && (
                <div className={`mt-4 p-3 rounded-lg border-2 text-center ${
                  claimStatus.includes('Error')
                    ? 'bg-red-50 border-red-600'
                    : 'bg-green-50 border-green-700'
                }`}>
                  <p className={`text-sm font-bold break-words ${
                    claimStatus.includes('Error') ? 'text-red-600' : 'text-green-700'
                  }`}>
                    {claimStatus}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
