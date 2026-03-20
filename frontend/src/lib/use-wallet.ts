'use client';

import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';

import { POLKADOT_HUB_TESTNET } from '@/lib/polkadot';

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown wallet error';
}

export function useInjectedWallet() {
  const { address: account, chainId, isConnected, isConnecting } = useAccount();
  const { openChainModal } = useChainModal();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && error) {
      setError(null);
    }
  }, [error, isConnected]);

  async function connect() {
    setError(null);

    if (account) {
      return account;
    }

    if (!openConnectModal) {
      setError('Wallet connection is unavailable right now. Reload and try again.');
      return null;
    }

    openConnectModal();
    return null;
  }

  async function switchToSupportedChain() {
    setError(null);

    try {
      await switchChainAsync({ chainId: POLKADOT_HUB_TESTNET.id });
      return true;
    } catch (nextError) {
      if (openChainModal) {
        openChainModal();
      }

      setError(toErrorMessage(nextError));
      return false;
    }
  }

  async function getWalletClient() {
    if (!walletClient) {
      throw new Error('Connect a wallet with RainbowKit before submitting.');
    }

    return walletClient;
  }

  return {
    account: account ?? null,
    chainId: chainId ?? null,
    connect,
    error,
    getWalletClient,
    isConnected,
    isConnecting: isConnecting || isSwitchingChain,
    isWalletAvailable: true,
    isWrongChain: isConnected && chainId !== POLKADOT_HUB_TESTNET.id,
    switchToSupportedChain,
  };
}
