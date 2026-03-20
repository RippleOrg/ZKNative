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
      <section className="py-12 text-center sm:py-16">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
          <span className="text-polkadot-pink">ZK</span>Native
        </h1>
        <p className="mb-2 text-base text-gray-300 sm:text-xl">
          Native Rust ZK verification for private apps on Polkadot,
        </p>
        <p className="mb-8 text-base text-gray-300 sm:text-xl">
          from voting and claims to access control and custom workflows via{' '}
          <span className="text-polkadot-pink font-semibold">PolkaVM</span>.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            href="/studio"
            className="rounded-lg bg-white px-6 py-3 text-center font-semibold text-polkadot-black transition-colors hover:bg-gray-200 sm:w-auto"
          >
            Build Custom Private App
          </Link>
          <Link
            href="/use-cases"
            className="rounded-lg bg-polkadot-pink px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-polkadot-pink-dark sm:w-auto"
          >
            Explore Use Cases →
          </Link>
          <Link
            href="/benchmark"
            className="rounded-lg border border-polkadot-gray px-6 py-3 text-center font-semibold text-white transition-colors hover:border-polkadot-pink sm:w-auto"
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
          title="Composable Privacy Apps"
          description="Reuse the same verifier across voting, claims, access control, and custom business logic."
        />
        <FeatureCard
          icon="⚡"
          title="PVM FFI"
          description="Solidity calls Rust via PolkaVM's native cross-language FFI. Unique to Polkadot."
        />
      </section>

      <section className="mb-16 grid gap-4 md:grid-cols-3">
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
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Live Example Contract</p>
          <p className="mt-3 font-mono text-white">
            {shortenHex(CONTRACT_ADDRESSES.PrivateVoting, 12, 8)}
          </p>
          <p className="mt-2 text-sm text-gray-400">Private voting is one deployed consumer app on top of the shared verifier</p>
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
            <h2 className="text-xl font-bold sm:text-2xl">Three concrete use cases powered by the same verifier</h2>
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
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">For Builders</p>
            <h2 className="mb-2 text-xl font-bold sm:text-2xl">Start with a template, then shape your own private flow</h2>
            <p className="text-sm text-gray-300 max-w-3xl">
              The studio and live templates show how one verifier can power multiple consumer
              contracts. Use the shipped examples as references, then export your own route,
              config, and integration checklist for a new ZKNative app.
            </p>
          </div>
          <Link
            href="/studio"
            className="bg-polkadot-pink hover:bg-polkadot-pink-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Open ZKNative Studio →
          </Link>
        </div>
      </section>

      {/* Why only on Polkadot comparison table */}
      <section className="mb-16">
        <h2 className="mb-6 text-center text-xl font-bold sm:text-2xl">Why Only Possible on Polkadot</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
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
                ['Cross-parachain privacy app settlement', '❌', '❌', '✅'],
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
        <div className="space-y-2 break-words font-mono text-xs text-gray-300 sm:text-sm">
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
