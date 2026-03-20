import Link from 'next/link';

import { UseCaseCard } from '@/components/use-case-card';
import { explorerAddressUrl, shortenHex } from '@/lib/clients';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { POLKADOT_HUB_TESTNET } from '@/lib/polkadot';
import { USE_CASES } from '@/lib/use-cases';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-polkadot-pink">ZK</span>Native
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          The first ZK proof verifier running in native Rust on a blockchain,
        </p>
        <p className="text-xl text-gray-300 mb-8">
          callable from Solidity via <span className="text-polkadot-pink font-semibold">PolkaVM</span>.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/vote"
            className="bg-white text-polkadot-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Cast a Live Vote
          </Link>
          <Link
            href="/results"
            className="bg-polkadot-pink hover:bg-polkadot-pink-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            View Live Results →
          </Link>
          <Link
            href="/benchmark"
            className="border border-polkadot-gray hover:border-polkadot-pink text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            View Benchmarks
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <FeatureCard
          icon="🦀"
          title="Rust ZK Verifier"
          description="Groth16 proof verification via arkworks compiled to PolkaVM — no EVM gas overhead."
        />
        <FeatureCard
          icon="🔒"
          title="Private Voting"
          description="Vote without revealing your address or token balance. ZK proofs ensure eligibility."
        />
        <FeatureCard
          icon="⚡"
          title="PVM FFI"
          description="Solidity calls Rust via PolkaVM's native cross-language FFI. Unique to Polkadot."
        />
      </section>

      <section className="grid gap-4 mb-16 md:grid-cols-3">
        <div className="rounded-xl border border-polkadot-gray bg-polkadot-gray/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Network</p>
          <h2 className="mt-3 text-xl font-semibold text-white">{POLKADOT_HUB_TESTNET.name}</h2>
          <p className="mt-2 text-sm text-gray-400">Chain ID {POLKADOT_HUB_TESTNET.id}</p>
        </div>
        <a
          href={explorerAddressUrl(CONTRACT_ADDRESSES.PrivateVoting)}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-polkadot-gray bg-polkadot-gray/60 p-5 transition-colors hover:border-polkadot-pink"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">PrivateVoting</p>
          <p className="mt-3 font-mono text-white">
            {shortenHex(CONTRACT_ADDRESSES.PrivateVoting, 12, 8)}
          </p>
          <p className="mt-2 text-sm text-gray-400">Live proposal and vote settlement contract</p>
        </a>
        <a
          href={explorerAddressUrl(CONTRACT_ADDRESSES.ZKNativeVerifier)}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-polkadot-gray bg-polkadot-gray/60 p-5 transition-colors hover:border-polkadot-pink"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">ZKNativeVerifier</p>
          <p className="mt-3 font-mono text-white">
            {shortenHex(CONTRACT_ADDRESSES.ZKNativeVerifier, 12, 8)}
          </p>
          <p className="mt-2 text-sm text-gray-400">Solidity entrypoint to the PolkaVM Rust verifier</p>
        </a>
      </section>

      <section className="mb-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Live Usecases</p>
            <h2 className="text-2xl font-bold">Three concrete use cases powered by the same verifier</h2>
          </div>
          <Link href="/use-cases" className="text-polkadot-pink hover:text-white transition-colors text-sm font-semibold">
            Compare all use cases →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {USE_CASES.map((useCase) => (
            <UseCaseCard key={useCase.slug} config={useCase} ctaLabel="Try Flow" />
          ))}
        </div>
      </section>

      <section className="bg-polkadot-gray rounded-xl p-6 mb-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">For Operators</p>
            <h2 className="text-2xl font-bold mb-2">Run live proposals and private vote settlement</h2>
            <p className="text-sm text-gray-300 max-w-3xl">
              The vote and result pages now read the deployed contracts directly. Proposal creation,
              finalization, nullifier checks, and browser-side proof generation are all wired for the
              current Polkadot Hub deployment.
            </p>
          </div>
          <Link
            href="/results"
            className="bg-polkadot-pink hover:bg-polkadot-pink-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Open Governance Console →
          </Link>
        </div>
      </section>

      {/* Why only on Polkadot comparison table */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Why Only Possible on Polkadot</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-polkadot-gray text-gray-400">
                <th className="text-left py-3 pr-6">Feature</th>
                <th className="text-center py-3 px-4">Ethereum</th>
                <th className="text-center py-3 px-4">Solana</th>
                <th className="text-center py-3 px-4 text-polkadot-pink">Polkadot Hub</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Call Rust libs from Solidity', '❌', '❌', '✅'],
                ['Native ZK verification in Rust', '❌', '⚠️ BPF only', '✅'],
                ['EVM-compatible + Rust FFI', '❌', '❌', '✅'],
                ['Cross-parachain XCM voting', '❌', '❌', '✅'],
              ].map(([feature, eth, sol, dot]) => (
                <tr key={feature} className="border-b border-polkadot-gray/50 hover:bg-polkadot-gray/20">
                  <td className="py-3 pr-6 text-gray-300">{feature}</td>
                  <td className="py-3 px-4 text-center">{eth}</td>
                  <td className="py-3 px-4 text-center">{sol}</td>
                  <td className="py-3 px-4 text-center font-semibold">{dot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Architecture */}
      <section className="bg-polkadot-gray rounded-xl p-6 mb-16">
        <h2 className="text-xl font-bold mb-4">Architecture</h2>
        <div className="font-mono text-sm text-gray-300 space-y-2">
          <div>🖥️  <span className="text-white">Frontend</span> → generates Groth16 proof in browser (snarkjs + WASM)</div>
          <div className="pl-4">↓ executeUseCase(contextId, proof, publicSignals)</div>
          <div>📜  <span className="text-white">Consumer Contract</span> → validates nullifier, root, and business logic</div>
          <div className="pl-4">↓ verifyProof(proof, signals)</div>
          <div>🔬  <span className="text-white">ZKNativeVerifier.sol</span> → dispatches to PVM precompile</div>
          <div className="pl-4">↓ staticcall(0x0900, abi.encode(proof, signals))</div>
          <div>🦀  <span className="text-polkadot-pink">PVM Rust Verifier</span> → arkworks Groth16 on BN254 (native speed)</div>
        </div>
        <div className="grid gap-3 md:grid-cols-3 mt-6 text-sm">
          <div className="rounded-lg bg-polkadot-black/40 p-4 text-gray-300">
            <span className="text-white font-semibold">PrivateVoting.sol</span> for anonymous governance.
          </div>
          <div className="rounded-lg bg-polkadot-black/40 p-4 text-gray-300">
            <span className="text-white font-semibold">PrivateAirdrop.sol</span> pattern for one-time private claims.
          </div>
          <div className="rounded-lg bg-polkadot-black/40 p-4 text-gray-300">
            <span className="text-white font-semibold">PrivacyPassIssuer.sol</span> pattern for gated access and credential minting.
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-polkadot-gray rounded-xl p-6 border border-polkadot-gray hover:border-polkadot-pink transition-colors">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
