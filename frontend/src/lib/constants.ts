// App-wide constants

export const MERKLE_TREE_DEPTH = 20;

export const VOTE_CHOICES = {
  AGAINST: 0,
  FOR: 1,
  ABSTAIN: 2,
} as const;

export const VOTE_CHOICE_LABELS: Record<number, string> = {
  0: 'Against',
  1: 'For',
  2: 'Abstain',
};

export const PUBLIC_SIGNALS_LAYOUT = {
  MERKLE_ROOT_IDX: 0,
  NULLIFIER_IDX: 1,
  PROPOSAL_ID_IDX: 2,
  VOTE_CHOICE_IDX: 3,
} as const;

export const POLKADOT_LINKS = {
  OPENGUILD_DISCORD: 'https://discord.gg/WWgzkDfPQF',
  SUBSTRATE_DEVS_TELEGRAM: 'https://t.me/substratedevs',
  DEMO_URL: 'https://zknative.vercel.app',
  GITHUB: 'https://github.com/RippleOrg/ZKNative',
} as const;
