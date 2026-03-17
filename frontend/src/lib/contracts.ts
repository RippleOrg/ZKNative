// Contract addresses and ABIs

export const CONTRACT_ADDRESSES = {
  ZKNativeVerifier: (process.env.NEXT_PUBLIC_ZKNATIVE_VERIFIER_ADDRESS ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`,
  PrivateVoting: (process.env.NEXT_PUBLIC_PRIVATE_VOTING_ADDRESS ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`,
  ZKNToken: (process.env.NEXT_PUBLIC_ZKN_TOKEN_ADDRESS ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`,
};

export const PRIVATE_VOTING_ABI = [
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
