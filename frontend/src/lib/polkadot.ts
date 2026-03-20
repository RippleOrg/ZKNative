import type { Chain } from 'viem';

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? 'https://services.polkadothub-rpc.com/testnet';

export const POLKADOT_HUB_TESTNET = {
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '420420417'),
  name: 'Polkadot Hub Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Polkadot Hub Native Token',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
    public: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-testnet.polkadot.io/',
    },
  },
  testnet: true,
} as const satisfies Chain;

export const POLKADOT_HUB_EXPLORER_URL =
  POLKADOT_HUB_TESTNET.blockExplorers.default.url;
