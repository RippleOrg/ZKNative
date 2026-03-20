'use client';

import { useEffect, useState } from 'react';
import { createWalletClient, custom, type Address } from 'viem';

import { POLKADOT_HUB_TESTNET } from '@/lib/polkadot';

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function parseHexChainId(value: string | null) {
  if (!value) return null;
  return Number.parseInt(value, 16);
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown wallet error';
}

export function useInjectedWallet() {
  const [account, setAccount] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isWalletAvailable, setIsWalletAvailable] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setIsWalletAvailable(false);
      return;
    }

    const provider = window.ethereum;
    setIsWalletAvailable(true);

    async function syncWalletState() {
      try {
        const [accounts, currentChainId] = await Promise.all([
          provider.request({ method: 'eth_accounts' }) as Promise<string[]>,
          provider.request({ method: 'eth_chainId' }) as Promise<string>,
        ]);

        setAccount((accounts[0] ?? null) as Address | null);
        setChainId(parseHexChainId(currentChainId));
      } catch (nextError) {
        setError(toErrorMessage(nextError));
      }
    }

    syncWalletState();

    const handleAccountsChanged = (accounts: unknown) => {
      const nextAccount =
        Array.isArray(accounts) && typeof accounts[0] === 'string'
          ? (accounts[0] as Address)
          : null;
      setAccount(nextAccount);
    };

    const handleChainChanged = (nextChainId: unknown) => {
      setChainId(typeof nextChainId === 'string' ? parseHexChainId(nextChainId) : null);
    };

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  async function connect() {
    if (!window.ethereum) {
      setError('No injected wallet found. Install MetaMask or another EVM wallet.');
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const [accounts, currentChainId] = await Promise.all([
        window.ethereum.request({ method: 'eth_requestAccounts' }) as Promise<string[]>,
        window.ethereum.request({ method: 'eth_chainId' }) as Promise<string>,
      ]);

      const nextAccount = (accounts[0] ?? null) as Address | null;
      setAccount(nextAccount);
      setChainId(parseHexChainId(currentChainId));
      return nextAccount;
    } catch (nextError) {
      setError(toErrorMessage(nextError));
      return null;
    } finally {
      setIsConnecting(false);
    }
  }

  async function switchToSupportedChain() {
    if (!window.ethereum) {
      setError('No injected wallet found.');
      return false;
    }

    const targetHexChainId = `0x${POLKADOT_HUB_TESTNET.id.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHexChainId }],
      });
      setChainId(POLKADOT_HUB_TESTNET.id);
      return true;
    } catch (nextError) {
      const errorCode =
        typeof nextError === 'object' &&
        nextError !== null &&
        'code' in nextError &&
        typeof nextError.code === 'number'
          ? nextError.code
          : null;

      if (errorCode === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: targetHexChainId,
              chainName: POLKADOT_HUB_TESTNET.name,
              nativeCurrency: POLKADOT_HUB_TESTNET.nativeCurrency,
              rpcUrls: POLKADOT_HUB_TESTNET.rpcUrls.default.http,
              blockExplorerUrls: [POLKADOT_HUB_TESTNET.blockExplorers.default.url],
            },
          ],
        });
        setChainId(POLKADOT_HUB_TESTNET.id);
        return true;
      }

      setError(toErrorMessage(nextError));
      return false;
    }
  }

  async function getWalletClient() {
    if (!window.ethereum) {
      throw new Error('No injected wallet found.');
    }

    return createWalletClient({
      chain: POLKADOT_HUB_TESTNET,
      transport: custom(window.ethereum),
    });
  }

  return {
    account,
    chainId,
    connect,
    error,
    getWalletClient,
    isConnected: Boolean(account),
    isConnecting,
    isWalletAvailable,
    isWrongChain:
      chainId !== null && chainId !== POLKADOT_HUB_TESTNET.id,
    switchToSupportedChain,
  };
}
