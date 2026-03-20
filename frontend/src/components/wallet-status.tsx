'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

import { POLKADOT_HUB_TESTNET } from '@/lib/polkadot';

export function WalletStatus() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        authenticationStatus,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          Boolean(account) &&
          Boolean(chain) &&
          (!authenticationStatus || authenticationStatus === 'authenticated');
        const needsSupportedChain =
          connected && (!!chain?.unsupported || chain?.id !== POLKADOT_HUB_TESTNET.id);

        if (!ready) {
          return (
            <div
              aria-hidden="true"
              className="h-9 w-36 rounded-lg border border-polkadot-gray bg-polkadot-gray/40 opacity-0"
            />
          );
        }

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              type="button"
              className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-polkadot-black transition-colors hover:bg-gray-200"
            >
              Connect Wallet
            </button>
          );
        }

        if (needsSupportedChain) {
          return (
            <button
              onClick={openChainModal}
              type="button"
              className="rounded-lg bg-polkadot-pink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-polkadot-pink-dark"
            >
              Switch to {POLKADOT_HUB_TESTNET.name}
            </button>
          );
        }

        return (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={openAccountModal}
              type="button"
              className="rounded-lg border border-polkadot-gray bg-polkadot-gray/50 px-3 py-2 text-xs text-white transition-colors hover:border-polkadot-pink"
            >
              {account?.displayName ?? 'Connected'}
            </button>
            <span className="text-[11px] text-gray-500">
              {chain?.name ?? POLKADOT_HUB_TESTNET.name}
            </span>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
