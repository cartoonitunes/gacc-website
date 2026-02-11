'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface WalletState {
  account: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  chainId: string | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletState>({
  account: null,
  provider: null,
  signer: null,
  chainId: null,
  isConnected: false,
  loading: false,
  error: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
  }, []);

  const connectWallet = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setError('Install MetaMask or open from your wallet browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const browserProvider = new BrowserProvider(ethereum);
      const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
      const network = await browserProvider.getNetwork();
      const networkId = network.chainId.toString();

      if (networkId !== (process.env.NEXT_PUBLIC_NETWORK_ID || '1')) {
        setError('Change network to Ethereum');
        setLoading(false);
        return;
      }

      const walletSigner = await browserProvider.getSigner();
      setProvider(browserProvider);
      setSigner(walletSigner);
      setAccount(accounts[0]);
      setChainId(networkId);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        reset();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [reset]);

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        signer,
        chainId,
        isConnected: !!account,
        loading,
        error,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
