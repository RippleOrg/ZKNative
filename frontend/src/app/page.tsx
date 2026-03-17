export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
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
        <div className="flex gap-4 justify-center">
          <a
            href="/vote"
            className="bg-polkadot-pink hover:bg-polkadot-pink-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Try Private Voting →
          </a>
          <a
            href="/benchmark"
            className="border border-polkadot-gray hover:border-polkadot-pink text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            View Benchmarks
          </a>
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
          <div className="pl-4">↓ castVote(proof, publicSignals)</div>
          <div>📜  <span className="text-white">PrivateVoting.sol</span> → validates public signals, calls verifier</div>
          <div className="pl-4">↓ verifyProof(proof, signals)</div>
          <div>🔬  <span className="text-white">ZKNativeVerifier.sol</span> → dispatches to PVM precompile</div>
          <div className="pl-4">↓ staticcall(0x0900, abi.encode(proof, signals))</div>
          <div>🦀  <span className="text-polkadot-pink">PVM Rust Verifier</span> → arkworks Groth16 on BN254 (native speed)</div>
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
