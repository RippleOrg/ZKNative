// Polkadot Hub chain configuration

export const POLKADOT_HUB_WESTEND = {
  id: 420420421,
  name: 'Polkadot Hub Westend',
  nativeCurrency: {
    decimals: 18,
    name: 'Westend',
    symbol: 'WND',
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL ??
          'https://westend-asset-hub-eth-rpc.polkadot.io',
      ],
    },
    public: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://westend-asset-hub.blockscout.com',
    },
  },
};
