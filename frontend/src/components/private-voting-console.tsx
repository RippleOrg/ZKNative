'use client';

import { useEffect, useState } from 'react';
import { toHex } from 'viem';

import {
  explorerAddressUrl,
  explorerTransactionUrl,
  publicClient,
  shortenHex,
} from '@/lib/clients';
import {
  CONTRACT_ADDRESSES,
  PRIVATE_VOTING_ABI,
  type PrivateVotingProposal,
} from '@/lib/contracts';
import {
  formatProposalDate,
  getProposalStatus,
  getProposalTotalVotes,
} from '@/lib/private-voting';
import { generateVotingProof, proofToSolidity, type ProofOutput } from '@/lib/proof';
import { usePrivateVotingData } from '@/lib/use-private-voting';
import { useInjectedWallet } from '@/lib/use-wallet';

const MERKLE_DEPTH = 20;

const VOTE_OPTIONS = [
  { label: 'Against', value: 0 },
  { label: 'For', value: 1 },
  { label: 'Abstain', value: 2 },
] as const;

interface GeneratedProofState extends ProofOutput {
  generationMs: number;
  nullifierHex: `0x${string}`;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

function parseBigIntList(value: string) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => BigInt(item));
}

function parseIndexList(value: string) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const parsed = Number(item);
      if (parsed !== 0 && parsed !== 1) {
        throw new Error('Merkle path indices must only contain 0 or 1.');
      }
      return parsed;
    });
}

function ProposalSelector({
  proposals,
  selectedProposalId,
  onSelect,
}: {
  proposals: PrivateVotingProposal[];
  selectedProposalId: string;
  onSelect: (proposalId: string) => void;
}) {
  return (
    <select
      value={selectedProposalId}
      onChange={(event) => onSelect(event.target.value)}
      className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
    >
      {proposals
        .slice()
        .reverse()
        .map((proposal) => (
          <option key={proposal.id.toString()} value={proposal.id.toString()}>
            #{proposal.id.toString()} · {proposal.title}
          </option>
        ))}
    </select>
  );
}

function proposalSummary(proposal: PrivateVotingProposal) {
  const status = getProposalStatus(proposal);
  const totalVotes = getProposalTotalVotes(proposal);

  return (
    <div className="rounded-xl border border-polkadot-gray bg-polkadot-gray/50 p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Proposal #{proposal.id.toString()}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">{proposal.title}</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.toneClass}`}>
          {status.label}
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-300">{proposal.description}</p>
      <div className="grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-lg bg-polkadot-black/40 p-3">
          <p className="text-xs text-gray-500">Voting Window</p>
          <p className="mt-1 text-white">{formatProposalDate(proposal.startTime)}</p>
          <p className="text-xs text-gray-500">to {formatProposalDate(proposal.endTime)}</p>
        </div>
        <div className="rounded-lg bg-polkadot-black/40 p-3">
          <p className="text-xs text-gray-500">Current Tally</p>
          <p className="mt-1 text-green-300">For {proposal.votesFor.toString()}</p>
          <p className="text-red-300">Against {proposal.votesAgainst.toString()}</p>
          <p className="text-gray-300">Abstain {proposal.votesAbstain.toString()}</p>
        </div>
        <div className="rounded-lg bg-polkadot-black/40 p-3">
          <p className="text-xs text-gray-500">Total Private Votes</p>
          <p className="mt-1 text-xl font-semibold text-white">{totalVotes.toString()}</p>
        </div>
      </div>
    </div>
  );
}

export function PrivateVotingConsole() {
  const { error, isLoading, merkleRoot, proposals, refresh } = usePrivateVotingData();
  const {
    account,
    connect,
    getWalletClient,
    isConnected,
    isConnecting,
    isWrongChain,
    switchToSupportedChain,
  } = useInjectedWallet();

  const [selectedProposalId, setSelectedProposalId] = useState('');
  const [voteChoice, setVoteChoice] = useState<number>(1);
  const [secret, setSecret] = useState('');
  const [eligibleAddress, setEligibleAddress] = useState('');
  const [nullifier, setNullifier] = useState('');
  const [pathElements, setPathElements] = useState('');
  const [pathIndices, setPathIndices] = useState('');
  const [generatedProof, setGeneratedProof] = useState<GeneratedProofState | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState<boolean | null>(null);

  const selectedProposal =
    proposals.find((proposal) => proposal.id.toString() === selectedProposalId) ?? null;

  useEffect(() => {
    if (!selectedProposalId && proposals.length > 0) {
      setSelectedProposalId(proposals[proposals.length - 1].id.toString());
    }
  }, [proposals, selectedProposalId]);

  useEffect(() => {
    if (!eligibleAddress && account) {
      setEligibleAddress(account);
    }
  }, [account, eligibleAddress]);

  useEffect(() => {
    if (secret || typeof window === 'undefined') return;

    const bytes = new Uint8Array(31);
    window.crypto.getRandomValues(bytes);
    const randomSecret = BigInt(
      `0x${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}`
    );
    setSecret(randomSecret.toString());
  }, [secret]);

  useEffect(() => {
    let cancelled = false;

    async function checkNullifier() {
      if (!generatedProof || !selectedProposal) {
        setAlreadyVoted(null);
        return;
      }

      try {
        const result = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.PrivateVoting,
          abi: PRIVATE_VOTING_ABI,
          functionName: 'hasVoted',
          args: [selectedProposal.id, generatedProof.nullifierHex],
        })) as boolean;

        if (!cancelled) {
          setAlreadyVoted(result);
        }
      } catch {
        if (!cancelled) {
          setAlreadyVoted(null);
        }
      }
    }

    checkNullifier();

    return () => {
      cancelled = true;
    };
  }, [generatedProof, selectedProposal]);

  async function handleGenerateProof() {
    if (!selectedProposal) {
      setGenerateError('Select a proposal before generating a proof.');
      return;
    }

    if (!merkleRoot) {
      setGenerateError('Unable to read the on-chain Merkle root.');
      return;
    }

    if (!eligibleAddress) {
      setGenerateError('Provide the eligible address used to build your Merkle leaf.');
      return;
    }

    setGenerateError(null);
    setSubmitError(null);
    setTxHash(null);
    setIsGenerating(true);

    try {
      const parsedPathElements = parseBigIntList(pathElements);
      const parsedPathIndices = parseIndexList(pathIndices);

      if (parsedPathElements.length !== MERKLE_DEPTH) {
        throw new Error(`Expected ${MERKLE_DEPTH} path elements.`);
      }

      if (parsedPathIndices.length !== MERKLE_DEPTH) {
        throw new Error(`Expected ${MERKLE_DEPTH} path indices.`);
      }

      const startedAt = performance.now();
      const output = await generateVotingProof({
        merkleRoot: BigInt(merkleRoot),
        nullifier: BigInt(nullifier),
        pathElements: parsedPathElements,
        pathIndices: parsedPathIndices,
        proposalId: selectedProposal.id,
        secret: BigInt(secret),
        voteChoice,
        voterAddress: BigInt(eligibleAddress),
      });

      setGeneratedProof({
        ...output,
        generationMs: Math.round(performance.now() - startedAt),
        nullifierHex: toHex(output.nullifier, { size: 32 }),
      });
    } catch (nextError) {
      setGeneratedProof(null);
      setGenerateError(toErrorMessage(nextError));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmitVote() {
    if (!generatedProof || !selectedProposal) {
      setSubmitError('Generate a valid proof before submitting your vote.');
      return;
    }

    setSubmitError(null);

    try {
      if (!isConnected) {
        const connectedAccount = await connect();
        if (!connectedAccount) return;
      }

      if (isWrongChain) {
        const switched = await switchToSupportedChain();
        if (!switched) return;
      }

      setIsSubmitting(true);

      const walletClient = await getWalletClient();
      const [from] = await walletClient.getAddresses();

      const hash = await walletClient.writeContract({
        account: from,
        address: CONTRACT_ADDRESSES.PrivateVoting,
        abi: PRIVATE_VOTING_ABI,
        functionName: 'castVote',
        args: [
          selectedProposal.id,
          proofToSolidity(generatedProof.proof),
          generatedProof.publicSignals,
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setTxHash(hash);
      refresh();
    } catch (nextError) {
      setSubmitError(toErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-polkadot-gray bg-polkadot-gray/40 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Live Private Voting</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="text-4xl font-bold">Generate a real Groth16 vote proof and submit it on-chain</h1>
            <p className="mt-4 max-w-3xl text-gray-300">
              This flow now reads the deployed contracts on Polkadot Hub testnet, generates a
              browser-side proof with the bundled circuit artifacts, and submits the proof to the
              live `PrivateVoting` contract.
            </p>
          </div>
          <div className="grid gap-3 text-sm">
            <a
              href={explorerAddressUrl(CONTRACT_ADDRESSES.PrivateVoting)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-polkadot-black/50 bg-polkadot-black/40 p-4 transition-colors hover:border-polkadot-pink"
            >
              <p className="text-xs text-gray-500">PrivateVoting</p>
              <p className="mt-1 font-mono text-white">{shortenHex(CONTRACT_ADDRESSES.PrivateVoting, 10, 8)}</p>
            </a>
            <a
              href={explorerAddressUrl(CONTRACT_ADDRESSES.ZKNativeVerifier)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-polkadot-black/50 bg-polkadot-black/40 p-4 transition-colors hover:border-polkadot-pink"
            >
              <p className="text-xs text-gray-500">ZKNativeVerifier</p>
              <p className="mt-1 font-mono text-white">{shortenHex(CONTRACT_ADDRESSES.ZKNativeVerifier, 10, 8)}</p>
            </a>
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="rounded-xl border border-polkadot-gray bg-polkadot-gray/40 p-5 text-sm text-gray-300">
          Loading proposal and Merkle root data from the deployed contracts...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-700 bg-amber-900/20 p-5 text-sm text-amber-200">
          Unable to load private voting state: {error}
        </div>
      )}

      {selectedProposal && proposalSummary(selectedProposal)}

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-polkadot-gray bg-polkadot-gray/40 p-6">
          <h2 className="text-xl font-semibold">Proof Inputs</h2>
          <p className="mt-2 text-sm text-gray-400">
            Paste the Merkle proof bundle issued for your allowlisted identity. The address stays
            local in the browser; the contract only sees the proof, the proposal, and the vote.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-gray-300">Proposal</span>
              <ProposalSelector
                proposals={proposals}
                selectedProposalId={selectedProposalId}
                onSelect={(proposalId) => {
                  setGeneratedProof(null);
                  setAlreadyVoted(null);
                  setSelectedProposalId(proposalId);
                }}
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-gray-300">Vote choice</span>
              <select
                value={voteChoice}
                onChange={(event) => {
                  setGeneratedProof(null);
                  setAlreadyVoted(null);
                  setVoteChoice(Number(event.target.value));
                }}
                className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
              >
                {VOTE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-gray-300">Secret</span>
              <input
                value={secret}
                onChange={(event) => {
                  setGeneratedProof(null);
                  setSecret(event.target.value);
                }}
                className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
                placeholder="Random secret bigint"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-gray-300">Eligible address</span>
              <input
                value={eligibleAddress}
                onChange={(event) => {
                  setGeneratedProof(null);
                  setEligibleAddress(event.target.value);
                }}
                className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
                placeholder="0x..."
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-gray-300">Expected nullifier</span>
              <input
                value={nullifier}
                onChange={(event) => {
                  setGeneratedProof(null);
                  setNullifier(event.target.value);
                }}
                className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
                placeholder="Poseidon(secret, proposalId)"
              />
            </label>

            <div className="rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 p-4 text-sm text-gray-300">
              <p className="text-xs text-gray-500">On-chain Merkle root</p>
              <code className="mt-2 block break-all text-xs text-white">
                {merkleRoot ?? 'Loading...'}
              </code>
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            <label className="space-y-2 text-sm">
              <span className="text-gray-300">Merkle path elements</span>
              <textarea
                value={pathElements}
                onChange={(event) => {
                  setGeneratedProof(null);
                  setPathElements(event.target.value);
                }}
                rows={5}
                className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
                placeholder="20 comma- or newline-separated bigint values"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-gray-300">Merkle path indices</span>
              <textarea
                value={pathIndices}
                onChange={(event) => {
                  setGeneratedProof(null);
                  setPathIndices(event.target.value);
                }}
                rows={3}
                className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white focus:border-polkadot-pink focus:outline-none"
                placeholder="20 comma- or newline-separated 0/1 values"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => void handleGenerateProof()}
              disabled={isGenerating || !selectedProposal}
              className="rounded-lg bg-polkadot-pink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-polkadot-pink-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? 'Generating proof...' : 'Generate Live Proof'}
            </button>
            <button
              onClick={() => void handleSubmitVote()}
              disabled={isSubmitting || !generatedProof || alreadyVoted === true}
              className="rounded-lg border border-polkadot-gray px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-polkadot-pink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConnecting
                ? 'Connecting wallet...'
                : isSubmitting
                ? 'Submitting vote...'
                : 'Submit Private Vote'}
            </button>
          </div>

          {generateError && (
            <div className="mt-4 rounded-lg border border-amber-700 bg-amber-900/20 p-4 text-sm text-amber-200">
              {generateError}
            </div>
          )}

          {submitError && (
            <div className="mt-4 rounded-lg border border-amber-700 bg-amber-900/20 p-4 text-sm text-amber-200">
              {submitError}
            </div>
          )}

          {txHash && (
            <div className="mt-4 rounded-lg border border-green-700 bg-green-900/20 p-4 text-sm text-green-200">
              Vote submitted successfully.{' '}
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

        <section className="space-y-4">
          <div className="rounded-2xl border border-polkadot-gray bg-polkadot-gray/40 p-6">
            <h2 className="text-xl font-semibold">Execution Readiness</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-300">
              <div className="rounded-lg bg-polkadot-black/40 p-4">
                <p className="text-xs text-gray-500">Connected wallet</p>
                <p className="mt-1 text-white">
                  {account ? shortenHex(account) : 'Not connected yet'}
                </p>
              </div>
              <div className="rounded-lg bg-polkadot-black/40 p-4">
                <p className="text-xs text-gray-500">Submission requirements</p>
                <p className="mt-1">
                  1. Proposal must still be active.
                </p>
                <p>2. Merkle path and nullifier must match the on-chain root.</p>
                <p>3. Wallet must be on the Polkadot Hub testnet EVM chain.</p>
              </div>
              {generatedProof && (
                <div className="rounded-lg bg-polkadot-black/40 p-4">
                  <p className="text-xs text-gray-500">Generated proof</p>
                  <p className="mt-1 text-white">{generatedProof.generationMs}ms in browser</p>
                  <code className="mt-2 block break-all text-xs text-polkadot-pink">
                    {generatedProof.nullifierHex}
                  </code>
                </div>
              )}
              {alreadyVoted !== null && (
                <div
                  className={`rounded-lg p-4 text-sm ${
                    alreadyVoted
                      ? 'border border-amber-700 bg-amber-900/20 text-amber-200'
                      : 'border border-green-700 bg-green-900/20 text-green-200'
                  }`}
                >
                  {alreadyVoted
                    ? 'This nullifier has already been used for the selected proposal.'
                    : 'This nullifier is currently unused for the selected proposal.'}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-polkadot-gray bg-polkadot-gray/40 p-6">
            <h2 className="text-xl font-semibold">Operator Notes</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-300">
              <p className="rounded-lg bg-polkadot-black/40 p-4">
                The proof bundle requires 20 Merkle path elements and 20 path indices because the
                voting circuit is compiled for a depth-20 tree.
              </p>
              <p className="rounded-lg bg-polkadot-black/40 p-4">
                The proving assets are synced into `frontend/public/circuits` automatically during
                `npm run dev` and `npm run build`, so the browser always uses the repo’s latest
                circuit artifacts.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
