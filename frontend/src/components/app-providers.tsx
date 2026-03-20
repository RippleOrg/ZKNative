'use client';

import { connectorsForWallets, darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import {
  braveWallet,
  injectedWallet,
  rabbyWallet,
  talismanWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { createConfig, http, WagmiProvider } from 'wagmi';

import { POLKADOT_HUB_TESTNET } from '@/lib/polkadot';

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '0a4f8da85fc03a4b02efcbf34fb6b818';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [injectedWallet, rabbyWallet, braveWallet, talismanWallet],
    },
  ],
  {
    appName: 'ZKNative',
    appDescription: 'Private apps powered by native Rust ZK verification on Polkadot Hub.',
    appUrl: 'https://zknative.vercel.app',
    projectId,
  }
);

const config = createConfig({
  chains: [POLKADOT_HUB_TESTNET],
  connectors,
  transports: {
    [POLKADOT_HUB_TESTNET.id]: http(POLKADOT_HUB_TESTNET.rpcUrls.default.http[0]),
  },
  ssr: true,
});

const rainbowTheme = darkTheme({
  accentColor: '#ff4ecd',
  accentColorForeground: '#09090b',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" theme={rainbowTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
