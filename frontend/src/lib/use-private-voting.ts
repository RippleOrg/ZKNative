'use client';

import { useEffect, useState } from 'react';
import type { Hex } from 'viem';

import {
  CONTRACT_ADDRESSES,
  PRIVATE_VOTING_ABI,
  type PrivateVotingProposal,
} from '@/lib/contracts';
import { publicClient } from '@/lib/clients';

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown RPC error';
}

export function usePrivateVotingData() {
  const [proposalCount, setProposalCount] = useState<bigint>(BigInt(0));
  const [proposals, setProposals] = useState<PrivateVotingProposal[]>([]);
  const [merkleRoot, setMerkleRoot] = useState<Hex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadVotingState() {
      setIsLoading(true);
      setError(null);

      try {
        const [count, root] = await Promise.all([
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.PrivateVoting,
            abi: PRIVATE_VOTING_ABI,
            functionName: 'proposalCount',
          }),
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.PrivateVoting,
            abi: PRIVATE_VOTING_ABI,
            functionName: 'merkleRoot',
          }),
        ]);

        const nextCount = count as bigint;
        const nextMerkleRoot = root as Hex;
        const nextProposals: PrivateVotingProposal[] = [];

        for (let proposalId = 1; proposalId <= Number(nextCount); proposalId += 1) {
          const proposal = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES.PrivateVoting,
            abi: PRIVATE_VOTING_ABI,
            functionName: 'getProposal',
            args: [BigInt(proposalId)],
          })) as PrivateVotingProposal;
          nextProposals.push(proposal);
        }

        if (!cancelled) {
          setProposalCount(nextCount);
          setMerkleRoot(nextMerkleRoot);
          setProposals(nextProposals);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(toErrorMessage(nextError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadVotingState();

    return () => {
      cancelled = true;
    };
  }, [refreshNonce]);

  return {
    error,
    isLoading,
    merkleRoot,
    proposalCount,
    proposals,
    refresh() {
      setRefreshNonce((value) => value + 1);
    },
  };
}
