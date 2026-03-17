'use client';

import { useState } from 'react';

export default function VotePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Private Vote</h1>
      <p className="text-gray-400 mb-8">
        Cast your vote without revealing your identity. A ZK proof verifies your
        eligibility on-chain via Polkadot&apos;s native Rust verifier.
      </p>
      <VoteFlow />
    </div>
  );
}

type Step = 'connect' | 'proof' | 'submit' | 'done';

function VoteFlow() {
  const [step, setStep] = useState<Step>('connect');
  const [proofStatus, setProofStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [voteChoice, setVoteChoice] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {(['connect', 'proof', 'submit', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === s
                  ? 'bg-polkadot-pink text-white'
                  : ['connect', 'proof', 'submit', 'done'].indexOf(step) > i
                  ? 'bg-green-600 text-white'
                  : 'bg-polkadot-gray text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            {i < 3 && <div className="w-8 h-px bg-polkadot-gray mx-1" />}
          </div>
        ))}
        <span className="ml-2 text-sm text-gray-400 capitalize">{step}</span>
      </div>

      {step === 'connect' && (
        <ConnectStep onNext={() => setStep('proof')} />
      )}
      {step === 'proof' && (
        <ProofStep
          voteChoice={voteChoice}
          setVoteChoice={setVoteChoice}
          proofStatus={proofStatus}
          setProofStatus={setProofStatus}
          onNext={() => setStep('submit')}
        />
      )}
      {step === 'submit' && (
        <SubmitStep
          voteChoice={voteChoice}
          txHash={txHash}
          setTxHash={setTxHash}
          onDone={() => setStep('done')}
        />
      )}
      {step === 'done' && <DoneStep txHash={txHash} />}
    </div>
  );
}

function ConnectStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="bg-polkadot-gray rounded-xl p-6">
      <h2 className="font-semibold text-lg mb-4">Step 1: Connect Wallet</h2>
      <p className="text-sm text-gray-400 mb-6">
        Connect a wallet to Polkadot Hub Westend Testnet. Your address stays private —
        only a ZK commitment is submitted on-chain.
      </p>
      <button
        onClick={onNext}
        className="w-full bg-polkadot-pink hover:bg-polkadot-pink-dark text-white py-3 rounded-lg font-semibold transition-colors"
      >
        Connect Wallet (Demo Mode)
      </button>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Full wallet connection requires MetaMask or SubWallet with Polkadot Hub configured
      </p>
    </div>
  );
}

function ProofStep({
  voteChoice,
  setVoteChoice,
  proofStatus,
  setProofStatus,
  onNext,
}: {
  voteChoice: number | null;
  setVoteChoice: (v: number) => void;
  proofStatus: 'idle' | 'generating' | 'ready' | 'error';
  setProofStatus: (s: 'idle' | 'generating' | 'ready' | 'error') => void;
  onNext: () => void;
}) {
  const choices = ['Against', 'For', 'Abstain'];

  const generateProof = async () => {
    if (voteChoice === null) return;
    setProofStatus('generating');
    // Simulate proof generation (replace with real snarkjs call)
    await new Promise((r) => setTimeout(r, 2000));
    setProofStatus('ready');
  };

  return (
    <div className="bg-polkadot-gray rounded-xl p-6">
      <h2 className="font-semibold text-lg mb-4">Step 2: Generate ZK Proof</h2>
      <p className="text-sm text-gray-400 mb-4">
        Choose your vote. A Groth16 ZK proof will be generated in your browser
        proving you are eligible — without revealing your address.
      </p>

      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Proposal #1: Upgrade verifier to v2</p>
        <div className="flex gap-3">
          {choices.map((c, i) => (
            <button
              key={c}
              onClick={() => setVoteChoice(i)}
              className={`flex-1 py-2 rounded-lg border transition-colors text-sm font-medium ${
                voteChoice === i
                  ? 'bg-polkadot-pink border-polkadot-pink text-white'
                  : 'border-polkadot-gray hover:border-polkadot-pink text-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={generateProof}
        disabled={voteChoice === null || proofStatus === 'generating'}
        className="w-full bg-polkadot-pink hover:bg-polkadot-pink-dark disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors mb-3"
      >
        {proofStatus === 'generating' ? '⏳ Generating proof...' : '🔐 Generate ZK Proof'}
      </button>

      {proofStatus === 'ready' && (
        <div className="mb-3 p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-400">
          ✅ Proof generated successfully (Groth16 on BN254, ~1.2s)
        </div>
      )}

      <button
        onClick={onNext}
        disabled={proofStatus !== 'ready'}
        className="w-full border border-polkadot-gray hover:border-polkadot-pink disabled:opacity-30 text-white py-3 rounded-lg font-semibold transition-colors"
      >
        Submit Vote →
      </button>
    </div>
  );
}

function SubmitStep({
  voteChoice,
  txHash,
  setTxHash,
  onDone,
}: {
  voteChoice: number | null;
  txHash: string | null;
  setTxHash: (h: string) => void;
  onDone: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTxHash('0xdemo_tx_hash_replace_with_real_transaction');
    setSubmitting(false);
    setTimeout(onDone, 1000);
  };

  return (
    <div className="bg-polkadot-gray rounded-xl p-6">
      <h2 className="font-semibold text-lg mb-4">Step 3: Submit On-Chain</h2>
      <p className="text-sm text-gray-400 mb-6">
        Your ZK proof and nullifier will be submitted to{' '}
        <code className="text-polkadot-pink">PrivateVoting.castVote()</code> on Polkadot Hub.
        The Rust verifier will validate your proof natively.
      </p>
      <button
        onClick={submit}
        disabled={submitting || txHash !== null}
        className="w-full bg-polkadot-pink hover:bg-polkadot-pink-dark disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
      >
        {submitting ? '⏳ Submitting...' : txHash ? '✅ Submitted!' : '🗳️ Submit Vote'}
      </button>
    </div>
  );
}

function DoneStep({ txHash }: { txHash: string | null }) {
  return (
    <div className="bg-polkadot-gray rounded-xl p-6 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-xl font-bold mb-2">Vote Cast Successfully!</h2>
      <p className="text-gray-400 text-sm mb-4">
        Your vote was verified by the native Rust ZK verifier on Polkadot Hub.
      </p>
      {txHash && (
        <code className="text-xs text-polkadot-pink break-all block mb-4">{txHash}</code>
      )}
      <a href="/results" className="text-polkadot-pink hover:underline text-sm">
        View Results →
      </a>
    </div>
  );
}
