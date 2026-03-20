// Contract addresses and ABIs

export interface PrivateVotingProposal {
  id: bigint;
  title: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  votesFor: bigint;
  votesAgainst: bigint;
  votesAbstain: bigint;
  finalized: boolean;
  passed: boolean;
}

const DEPLOYED_ADDRESSES = {
  ZKNativeVerifier: '0x79a8979b0ed0F57CD840e2BBC3CA7071E37913d0',
  PrivateVoting: '0x4eA0e6Bc7e76ed28CF39381e58fBC6193f5a8b43',
  ZKNToken: '0xA1D135E125e1C1B5713478266E18d85d66273a48',
} as const;

export const CONTRACT_ADDRESSES = {
  ZKNativeVerifier: (process.env.NEXT_PUBLIC_ZKNATIVE_VERIFIER_ADDRESS ??
    DEPLOYED_ADDRESSES.ZKNativeVerifier) as `0x${string}`,
  PrivateVoting: (process.env.NEXT_PUBLIC_PRIVATE_VOTING_ADDRESS ??
    DEPLOYED_ADDRESSES.PrivateVoting) as `0x${string}`,
  ZKNToken: (process.env.NEXT_PUBLIC_ZKN_TOKEN_ADDRESS ??
    DEPLOYED_ADDRESSES.ZKNToken) as `0x${string}`,
};

export const HAS_CONFIGURED_CONTRACTS = Object.values(CONTRACT_ADDRESSES).every(
  (address) => address !== '0x0000000000000000000000000000000000000000'
);

export const PRIVATE_VOTING_ABI = [
  {
    type: 'function',
    name: 'proposalCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'merkleRoot',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'castVote',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      {
        name: 'proof',
        type: 'tuple',
        components: [
          { name: 'a', type: 'uint256[2]' },
          { name: 'b', type: 'uint256[2][2]' },
          { name: 'c', type: 'uint256[2]' },
        ],
      },
      { name: 'publicSignals', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'createProposal',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
    ],
    outputs: [{ name: 'proposalId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'finalizeProposal',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'hasVoted',
    stateMutability: 'view',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'nullifier', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getProposal',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'votesFor', type: 'uint256' },
          { name: 'votesAgainst', type: 'uint256' },
          { name: 'votesAbstain', type: 'uint256' },
          { name: 'finalized', type: 'bool' },
          { name: 'passed', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true },
      { name: 'nullifier', type: 'bytes32', indexed: false },
      { name: 'voteChoice', type: 'uint8', indexed: false },
    ],
  },
] as const;

export const ZK_VERIFIER_ABI = [
  {
    type: 'function',
    name: 'verifyProof',
    stateMutability: 'view',
    inputs: [
      {
        name: 'proof',
        type: 'tuple',
        components: [
          { name: 'a', type: 'uint256[2]' },
          { name: 'b', type: 'uint256[2][2]' },
          { name: 'c', type: 'uint256[2]' },
        ],
      },
      { name: 'publicSignals', type: 'uint256[]' },
    ],
    outputs: [{ name: 'valid', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'lastVerificationGas',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
