import type { PrivateVotingProposal } from '@/lib/contracts';

export function formatProposalDate(timestamp: bigint) {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

export function getProposalTotalVotes(proposal: PrivateVotingProposal) {
  return proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
}

export function getProposalStatus(proposal: PrivateVotingProposal) {
  const now = BigInt(Math.floor(Date.now() / 1000));

  if (proposal.finalized) {
    return {
      canFinalize: false,
      canVote: false,
      label: proposal.passed ? 'Passed' : 'Finalized',
      toneClass: proposal.passed
        ? 'bg-green-900/40 text-green-300'
        : 'bg-slate-800 text-slate-300',
    };
  }

  if (proposal.startTime > now) {
    return {
      canFinalize: false,
      canVote: false,
      label: 'Scheduled',
      toneClass: 'bg-blue-900/40 text-blue-300',
    };
  }

  if (proposal.endTime < now) {
    return {
      canFinalize: true,
      canVote: false,
      label: 'Ready to Finalize',
      toneClass: 'bg-amber-900/40 text-amber-300',
    };
  }

  return {
    canFinalize: false,
    canVote: true,
    label: 'Active',
    toneClass: 'bg-polkadot-pink/20 text-polkadot-pink',
  };
}
