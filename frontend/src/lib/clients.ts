import { createPublicClient, http } from 'viem';

import { POLKADOT_HUB_EXPLORER_URL, POLKADOT_HUB_TESTNET } from '@/lib/polkadot';

export const publicClient = createPublicClient({
  chain: POLKADOT_HUB_TESTNET,
  transport: http(POLKADOT_HUB_TESTNET.rpcUrls.default.http[0]),
});

export function shortenHex(value: string, start: number = 6, end: number = 4) {
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function explorerAddressUrl(address: string) {
  return `${POLKADOT_HUB_EXPLORER_URL}/address/${address}`;
}

export function explorerTransactionUrl(hash: string) {
  return `${POLKADOT_HUB_EXPLORER_URL}/tx/${hash}`;
}
