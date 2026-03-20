export type BuiltInUseCaseSlug = 'vote' | 'airdrop' | 'access';
export type UseCaseSlug = BuiltInUseCaseSlug | 'custom';

export interface UseCaseMetric {
  label: string;
  value: string;
}

export interface UseCaseAction {
  code: number;
  label: string;
  description: string;
}

export interface UseCaseScenario {
  id: string;
  label: string;
  summary: string;
  contextValue: number;
  settlement: string;
}

export interface UseCaseConfig {
  slug: string;
  href: string;
  navLabel: string;
  icon: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  description: string;
  privacyPromise: string;
  contractCall: string;
  contractSummary: string;
  scenarioLabel: string;
  contextLabel: string;
  actionLabel: string;
  proofButtonLabel: string;
  submitButtonLabel: string;
  successTitle: string;
  successDescription: string;
  successLinkHref: string;
  successLinkLabel: string;
  benchmark: string;
  metrics: UseCaseMetric[];
  actionOptions: UseCaseAction[];
  scenarios: UseCaseScenario[];
  proofChecklist: string[];
  technicalHighlights: string[];
}

export const USE_CASES: UseCaseConfig[] = [
  {
    slug: 'vote',
    href: '/vote',
    navLabel: 'Private Voting',
    icon: '🗳️',
    eyebrow: 'Private Governance',
    title: 'Private Voting',
    shortTitle: 'Vote',
    description:
      'Cast governance votes without revealing which eligible wallet participated. The chain only sees the proposal, the vote choice, and a one-time nullifier.',
    privacyPromise:
      'Eligibility is proven in zero knowledge, so the tally is public while the participating address stays private.',
    contractCall: 'PrivateVoting.castVote(proposalId, proof, publicSignals)',
    contractSummary:
      'The voting contract validates the active proposal, checks the nullifier and Merkle root, then delegates Groth16 verification to ZKNativeVerifier on PolkaVM.',
    scenarioLabel: 'Proposal',
    contextLabel: 'proposalId',
    actionLabel: 'voteChoice',
    proofButtonLabel: 'Generate Vote Proof',
    submitButtonLabel: 'Submit Private Vote',
    successTitle: 'Vote recorded privately',
    successDescription:
      'The DAO accepted your ballot without learning which allowlisted address cast it.',
    successLinkHref: '/results',
    successLinkLabel: 'View proposal results',
    benchmark: '~10x cheaper Groth16 verification than Solidity-only execution.',
    metrics: [
      { label: 'Proof System', value: 'Groth16 / BN254' },
      { label: 'Nullifier Scope', value: 'Per voter, per proposal' },
      { label: 'On-Chain Action', value: 'Tally vote privately' },
      { label: 'Verifier Path', value: 'Solidity -> PVM Rust' },
    ],
    actionOptions: [
      {
        code: 0,
        label: 'Against',
        description: 'Reject the upgrade and keep the current verifier path.',
      },
      {
        code: 1,
        label: 'For',
        description: 'Approve the proposal while keeping the voter anonymous.',
      },
      {
        code: 2,
        label: 'Abstain',
        description: 'Record participation without influencing the outcome.',
      },
    ],
    scenarios: [
      {
        id: 'verifier-upgrade',
        label: 'Proposal #1',
        summary:
          'Upgrade the verifier precompile binding to v2 with batched public signal decoding.',
        contextValue: 1,
        settlement: 'One private vote is tallied on-chain.',
      },
      {
        id: 'xcm-rollout',
        label: 'Proposal #2',
        summary: 'Enable cross-parachain XCM relays for governance turnout incentives.',
        contextValue: 2,
        settlement: 'The vote contributes to a public tally with a hidden identity.',
      },
    ],
    proofChecklist: [
      'Prove membership in the voter Merkle tree.',
      'Bind the proof to a single proposal-specific nullifier.',
      'Commit to a vote choice without revealing the wallet address.',
    ],
    technicalHighlights: [
      'Identical verifier path works for any Groth16-compatible consumer contract.',
      'Replay protection is handled by a nullifier registry instead of wallet addresses.',
      'The same Rust verifier can be reused across governance, claims, and credential flows.',
    ],
  },
  {
    slug: 'airdrop',
    href: '/airdrop',
    navLabel: 'Stealth Airdrop',
    icon: '🎁',
    eyebrow: 'Private Distribution',
    title: 'Stealth Airdrop Claims',
    shortTitle: 'Airdrop',
    description:
      'Let eligible wallets redeem rewards without revealing which address qualified or which retention tier they belong to. The claim contract only learns the tier and campaign.',
    privacyPromise:
      'The distributor verifies Merkle membership and a campaign-scoped nullifier, so each eligible claimant redeems once without linking the payout to their source wallet.',
    contractCall: 'PrivateAirdrop.claim(campaignId, tier, proof, publicSignals)',
    contractSummary:
      'A distributor contract checks the campaign root, blocks replay via nullifiers, and sends the tiered reward after the native Rust verifier approves the proof.',
    scenarioLabel: 'Campaign',
    contextLabel: 'campaignId',
    actionLabel: 'claimTier',
    proofButtonLabel: 'Generate Claim Proof',
    submitButtonLabel: 'Claim Airdrop Privately',
    successTitle: 'Airdrop redeemed privately',
    successDescription:
      'The reward was released without exposing the qualifying wallet or portfolio history behind it.',
    successLinkHref: '/use-cases',
    successLinkLabel: 'Explore another use case',
    benchmark: 'One verifier powers retroactive rewards, loyalty drops, and claim portals.',
    metrics: [
      { label: 'Proof System', value: 'Groth16 / BN254' },
      { label: 'Nullifier Scope', value: 'Per wallet, per campaign' },
      { label: 'On-Chain Action', value: 'Release tiered rewards' },
      { label: 'Verifier Path', value: 'Solidity -> PVM Rust' },
    ],
    actionOptions: [
      {
        code: 0,
        label: 'Community',
        description: 'Claim the baseline drop for general allowlisted users.',
      },
      {
        code: 1,
        label: 'Power User',
        description: 'Redeem an amplified tier for heavy on-chain participation.',
      },
      {
        code: 2,
        label: 'Builder',
        description: 'Unlock the top reward tier reserved for ecosystem contributors.',
      },
    ],
    scenarios: [
      {
        id: 'genesis-retrodrop',
        label: 'Genesis Retrodrop',
        summary:
          'Reward early Polkadot Hub users without leaking which addresses were active during launch.',
        contextValue: 41,
        settlement: 'Tokens stream to the claimant after one private redemption.',
      },
      {
        id: 'hackathon-loyalty',
        label: 'Hackathon Loyalty',
        summary:
          'Distribute contributor rewards without publishing the wallet list used for ranking.',
        contextValue: 77,
        settlement: 'The contract unlocks a campaign-specific reward tier.',
      },
    ],
    proofChecklist: [
      'Prove the claimant belongs to the allowlist Merkle root.',
      'Bind redemption to a campaign-specific nullifier so it can only happen once.',
      'Reveal the reward tier without revealing the qualifying wallet identity.',
    ],
    technicalHighlights: [
      'Reward programs can stay private even when the drop logic settles fully on-chain.',
      'Tiered claims reuse the same verifier and only change the consumer contract logic.',
      'PolkaVM avoids the gas spikes that make recurring Groth16 claims expensive on EVM-only paths.',
    ],
  },
  {
    slug: 'access',
    href: '/access',
    navLabel: 'Access Passes',
    icon: '🎟️',
    eyebrow: 'Private Access Control',
    title: 'Anonymous Access Passes',
    shortTitle: 'Access',
    description:
      'Mint event or program passes on-chain without leaking the member, contributor, or attendee address behind the proof. The contract learns only the pass type and program.',
    privacyPromise:
      'A program-scoped nullifier enforces one mint or check-in per member while preserving the privacy of the address that qualified.',
    contractCall: 'PrivacyPassIssuer.mintPass(programId, accessLevel, proof, publicSignals)',
    contractSummary:
      'A pass issuer contract verifies the allowlist root and nullifier, then mints or activates a pass once the ZK proof clears the native Rust verifier.',
    scenarioLabel: 'Program',
    contextLabel: 'programId',
    actionLabel: 'accessLevel',
    proofButtonLabel: 'Generate Access Proof',
    submitButtonLabel: 'Mint Anonymous Pass',
    successTitle: 'Access pass minted',
    successDescription:
      'The program issued access without exposing the attendee or contributor wallet behind it.',
    successLinkHref: '/use-cases',
    successLinkLabel: 'Compare all use cases',
    benchmark: 'Ideal for gated communities, summits, contributor houses, and private check-ins.',
    metrics: [
      { label: 'Proof System', value: 'Groth16 / BN254' },
      { label: 'Nullifier Scope', value: 'Per member, per program' },
      { label: 'On-Chain Action', value: 'Mint or activate pass' },
      { label: 'Verifier Path', value: 'Solidity -> PVM Rust' },
    ],
    actionOptions: [
      {
        code: 0,
        label: 'Attendee',
        description: 'Activate a standard event access pass.',
      },
      {
        code: 1,
        label: 'Speaker',
        description: 'Mint a higher-tier pass for presenters and workshop leads.',
      },
      {
        code: 2,
        label: 'Ops',
        description: 'Issue a backstage or operator credential with the same privacy guarantees.',
      },
    ],
    scenarios: [
      {
        id: 'governance-summit',
        label: 'Governance Summit',
        summary:
          'Attendees prove membership in the invited set without leaking the address used during registration.',
        contextValue: 7,
        settlement: 'A pass is minted or activated for one invited member.',
      },
      {
        id: 'builders-residency',
        label: 'Builders Residency',
        summary:
          'Contributors unlock residency access based on allowlisted eligibility without public doxxing.',
        contextValue: 12,
        settlement: 'One anonymous pass is issued for the selected program track.',
      },
    ],
    proofChecklist: [
      'Prove membership in a program-specific allowlist.',
      'Use a nullifier to prevent multiple mints or duplicate check-ins.',
      'Expose only the pass type while hiding the qualifying wallet.',
    ],
    technicalHighlights: [
      'The same verifier supports both mint-once passes and repeated gated actions.',
      'Identity-sensitive communities can gate access without exposing member wallets.',
      'This pattern is especially strong on Polkadot where the verifier cost stays predictable.',
    ],
  },
];

export const USE_CASES_BY_SLUG = Object.fromEntries(
  USE_CASES.map((useCase) => [useCase.slug, useCase])
) as Record<BuiltInUseCaseSlug, UseCaseConfig>;
