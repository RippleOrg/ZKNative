'use client';

import { shortenHex } from '@/lib/clients';
import { POLKADOT_HUB_TESTNET } from '@/lib/polkadot';
import { useInjectedWallet } from '@/lib/use-wallet';

export function WalletStatus() {
  const {
    account,
    connect,
    error,
    isConnected,
    isConnecting,
    isWalletAvailable,
    isWrongChain,
    switchToSupportedChain,
  } = useInjectedWallet();

  if (!isWalletAvailable) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-polkadot-gray px-3 py-2 text-xs text-gray-300 transition-colors hover:border-polkadot-pink hover:text-white"
      >
        Install Wallet
      </a>
    );
  }

  if (isWrongChain) {
    return (
      <button
        onClick={() => void switchToSupportedChain()}
        className="rounded-lg bg-polkadot-pink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-polkadot-pink-dark"
      >
        Switch to {POLKADOT_HUB_TESTNET.name}
      </button>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => void connect()}
          className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-polkadot-black transition-colors hover:bg-gray-200"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {error && <p className="max-w-48 text-right text-[11px] text-amber-300">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="rounded-lg border border-polkadot-gray bg-polkadot-gray/50 px-3 py-2 text-xs text-white">
        {account ? shortenHex(account) : 'Connected'}
      </span>
      <span className="text-[11px] text-gray-500">{POLKADOT_HUB_TESTNET.name}</span>
    </div>
  );
}
