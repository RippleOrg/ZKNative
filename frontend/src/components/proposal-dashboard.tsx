'use client';

import { useState } from 'react';

import {
  explorerAddressUrl,
  explorerTransactionUrl,
  publicClient,
  shortenHex,
} from '@/lib/clients';
import { CONTRACT_ADDRESSES, PRIVATE_VOTING_ABI } from '@/lib/contracts';
import {
  formatProposalDate,
  getProposalStatus,
  getProposalTotalVotes,
} from '@/lib/private-voting';
import { usePrivateVotingData } from '@/lib/use-private-voting';
import { useInjectedWallet } from '@/lib/use-wallet';

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown transaction error';
}

function formatDateTimeInput(offsetMs: number) {
  const value = new Date(Date.now() + offsetMs);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ProposalDashboard() {
  const { error, isLoading, proposalCount, proposals, refresh } = usePrivateVotingData();
  const {
    connect,
    getWalletClient,
    isConnected,
    isConnecting,
    isWrongChain,
    switchToSupportedChain,
  } = useInjectedWallet();

  const [title, setTitle] = useState('Enable weighted anonymous voting');
  const [description, setDescription] = useState(
    'Add a follow-up circuit that keeps the voter private while proving membership in a weighted cohort.'
  );
  const [startTime, setStartTime] = useState(formatDateTimeInput(5 * 60 * 1000));
  const [endTime, setEndTime] = useState(formatDateTimeInput(2 * 24 * 60 * 60 * 1000));
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  async function ensureWalletReady() {
    if (!isConnected) {
      const connectedAccount = await connect();
      if (!connectedAccount) return false;
    }

    if (isWrongChain) {
      const switched = await switchToSupportedChain();
      if (!switched) return false;
    }

    return true;
  }

  async function handleCreateProposal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);

    try {
      const ready = await ensureWalletReady();
      if (!ready) return;

      const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

      if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
        throw new Error('Choose valid start and end times.');
      }

      if (endTimestamp <= startTimestamp) {
        throw new Error('The end time must be later than the start time.');
      }

      setPendingAction('create');

      const walletClient = await getWalletClient();
      const [from] = await walletClient.getAddresses();
      const hash = await walletClient.writeContract({
        account: from,
        address: CONTRACT_ADDRESSES.PrivateVoting,
        abi: PRIVATE_VOTING_ABI,
        functionName: 'createProposal',
        args: [title, description, BigInt(startTimestamp), BigInt(endTimestamp)],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setTxHash(hash);
      refresh();
    } catch (nextError) {
      setActionError(toErrorMessage(nextError));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleFinalizeProposal(proposalId: bigint) {
    setActionError(null);

    try {
      const ready = await ensureWalletReady();
      if (!ready) return;

      setPendingAction(`finalize-${proposalId.toString()}`);

      const walletClient = await getWalletClient();
      const [from] = await walletClient.getAddresses();
      const hash = await walletClient.writeContract({
        account: from,
        address: CONTRACT_ADDRESSES.PrivateVoting,
        abi: PRIVATE_VOTING_ABI,
        functionName: 'finalizeProposal',
        args: [proposalId],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setTxHash(hash);
      refresh();
    } catch (nextError) {
      setActionError(toErrorMessage(nextError));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-polkadot-gray bg-polkadot-gray/40 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Live Governance State</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h1 className="text-4xl font-bold">Proposal results are now backed by the deployed contract</h1>
            <p className="mt-4 max-w-3xl text-gray-300">
              This page reads the current `proposalCount`, proposal structs, and aggregate vote
              tallies directly from the `PrivateVoting` deployment instead of using hard-coded demo
              data.
            </p>
          </div>
          <div className="grid gap-3 text-sm">
            <a
              href={explorerAddressUrl(CONTRACT_ADDRESSES.PrivateVoting)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-polkadot-black/50 bg-polkadot-black/40 p-4 transition-colors hover:border-polkadot-pink"
            >
              <p className="text-xs text-gray-500">PrivateVoting contract</p>
              <p className="mt-1 font-mono text-white">{shortenHex(CONTRACT_ADDRESSES.PrivateVoting, 10, 8)}</p>
            </a>
            <div className="rounded-xl border border-polkadot-black/50 bg-polkadot-black/40 p-4">
              <p className="text-xs text-gray-500">Total proposals discovered</p>
              <p className="mt-1 text-2xl font-semibold text-white">{proposalCount.toString()}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-polkadot-gray bg-polkadot-gray/40 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Create Proposal</h2>
            <p className="mt-2 text-sm text-gray-400">
              This uses the live `createProposal` contract method. The connected wallet must hold
              `PROPOSAL_CREATOR_ROLE`.
            </p>
          </div>
          <div className="rounded-lg border border-polkadot-gray bg-polkadot-black/30 px-3 py-2 text-xs text-gray-300">
            {isConnecting ? 'Connecting wallet...' : 'Write access requires the correct role'}
          </div>
        </div>

        <form onSubmit={handleCreateProposal} className="grid gap-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
            placeholder="Proposal title"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
            placeholder="Proposal description"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-gray-300">Start time</span>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-gray-300">End time</span>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={pendingAction === 'create'}
            className="rounded-lg bg-polkadot-pink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-polkadot-pink-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === 'create' ? 'Creating proposal...' : 'Create Proposal'}
          </button>
        </form>

        {actionError && (
          <div className="mt-4 rounded-lg border border-amber-700 bg-amber-900/20 p-4 text-sm text-amber-200">
            {actionError}
          </div>
        )}

        {txHash && (
          <div className="mt-4 rounded-lg border border-green-700 bg-green-900/20 p-4 text-sm text-green-200">
            Latest write confirmed.{' '}
            <a
              href={explorerTransactionUrl(txHash)}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white underline"
            >
              View transaction
            </a>
          </div>
        )}
      </section>

      {isLoading && (
        <div className="rounded-xl border border-polkadot-gray bg-polkadot-gray/40 p-5 text-sm text-gray-300">
          Loading live proposals...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-700 bg-amber-900/20 p-5 text-sm text-amber-200">
          Unable to load proposals: {error}
        </div>
      )}

      <section className="space-y-6">
        {proposals.length === 0 && !isLoading ? (
          <div className="rounded-2xl border border-polkadot-gray bg-polkadot-gray/40 p-8 text-center">
            <h2 className="text-2xl font-semibold">No proposals on-chain yet</h2>
            <p className="mt-3 text-sm text-gray-400">
              Use the create form above to seed the first live governance proposal for this
              deployment.
            </p>
          </div>
        ) : (
          proposals
            .slice()
            .reverse()
            .map((proposal) => {
              const totalVotes = getProposalTotalVotes(proposal);
              const status = getProposalStatus(proposal);
              const percentagePrecision = BigInt(10000);
              const noVotes = BigInt(0);
              const forPct =
                totalVotes > noVotes
                  ? Number((proposal.votesFor * percentagePrecision) / totalVotes) / 100
                  : 0;
              const againstPct =
                totalVotes > noVotes
                  ? Number((proposal.votesAgainst * percentagePrecision) / totalVotes) / 100
                  : 0;
              const abstainPct =
                totalVotes > noVotes
                  ? Number((proposal.votesAbstain * percentagePrecision) / totalVotes) / 100
                  : 0;

              return (
                <article
                  key={proposal.id.toString()}
                  className="rounded-2xl border border-polkadot-gray bg-polkadot-gray/40 p-6"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                        Proposal #{proposal.id.toString()}
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">{proposal.title}</h2>
                      <p className="mt-3 max-w-3xl text-sm text-gray-300">{proposal.description}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.toneClass}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="mb-4 h-3 overflow-hidden rounded-full bg-polkadot-black">
                    <div className="flex h-full">
                      <div className="bg-green-500" style={{ width: `${forPct}%` }} />
                      <div className="bg-red-500" style={{ width: `${againstPct}%` }} />
                      <div className="bg-slate-500" style={{ width: `${abstainPct}%` }} />
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm md:grid-cols-4">
                    <div className="rounded-lg bg-polkadot-black/40 p-4">
                      <p className="text-xs text-gray-500">For</p>
                      <p className="mt-1 text-lg font-semibold text-green-300">
                        {proposal.votesFor.toString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-polkadot-black/40 p-4">
                      <p className="text-xs text-gray-500">Against</p>
                      <p className="mt-1 text-lg font-semibold text-red-300">
                        {proposal.votesAgainst.toString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-polkadot-black/40 p-4">
                      <p className="text-xs text-gray-500">Abstain</p>
                      <p className="mt-1 text-lg font-semibold text-slate-300">
                        {proposal.votesAbstain.toString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-polkadot-black/40 p-4">
                      <p className="text-xs text-gray-500">Voting window</p>
                      <p className="mt-1 text-white">{formatProposalDate(proposal.startTime)}</p>
                      <p className="text-xs text-gray-500">to {formatProposalDate(proposal.endTime)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
                    <p>Total private votes: {totalVotes.toString()}</p>
                    {status.canFinalize && (
                      <button
                        onClick={() => void handleFinalizeProposal(proposal.id)}
                        disabled={pendingAction === `finalize-${proposal.id.toString()}`}
                        className="rounded-lg border border-polkadot-gray px-4 py-2 font-semibold text-white transition-colors hover:border-polkadot-pink disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pendingAction === `finalize-${proposal.id.toString()}`
                          ? 'Finalizing...'
                          : 'Finalize Proposal'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })
        )}
      </section>
    </div>
  );
}
