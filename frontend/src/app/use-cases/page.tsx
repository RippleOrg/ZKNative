import Link from 'next/link';

import { UseCaseCard } from '@/components/use-case-card';
import { USE_CASES } from '@/lib/use-cases';

export default function UseCasesPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <section className="mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">Three Live ZKNative Flows</p>
        <h1 className="text-4xl font-bold mb-4">Beyond one use case, the verifier already supports a pattern library</h1>
        <p className="text-lg text-gray-300 max-w-4xl">
          ZKNative is not limited to private voting. Any consumer contract that needs
          membership proofs, nullifiers, and context-bound execution can reuse the same
          native Rust verifier path on Polkadot Hub.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3 mb-12">
        {USE_CASES.map((useCase) => (
          <UseCaseCard key={useCase.slug} config={useCase} />
        ))}
      </section>

      <section className="bg-polkadot-gray rounded-xl p-6 mb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Need Something New?</p>
            <h2 className="text-2xl font-bold mb-2">Open the ZKNative Studio</h2>
            <p className="text-sm text-gray-300 max-w-3xl">
              Build a brand new use case with template controls, live preview, and exportable TypeScript
              snippets for the route, config, and contract integration checklist.
            </p>
          </div>
          <Link
            href="/studio"
            className="bg-polkadot-pink hover:bg-polkadot-pink-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Launch Studio →
          </Link>
        </div>
      </section>

      <section className="bg-polkadot-gray rounded-xl p-6 mb-12">
        <h2 className="text-2xl font-bold mb-4">Use Case Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-polkadot-black text-gray-400">
                <th className="text-left py-3 pr-4">Use Case</th>
                <th className="text-left py-3 pr-4">What stays private</th>
                <th className="text-left py-3 pr-4">Consumer contract</th>
                <th className="text-left py-3">Nullifier scope</th>
              </tr>
            </thead>
            <tbody>
              {USE_CASES.map((useCase) => (
                <tr key={useCase.slug} className="border-b border-polkadot-black/50 align-top">
                  <td className="py-4 pr-4">
                    <p className="font-semibold">{useCase.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{useCase.eyebrow}</p>
                  </td>
                  <td className="py-4 pr-4 text-gray-300">{useCase.privacyPromise}</td>
                  <td className="py-4 pr-4">
                    <code className="text-polkadot-pink break-all">{useCase.contractCall}</code>
                  </td>
                  <td className="py-4 text-gray-300">{useCase.metrics[1]?.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-polkadot-gray rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Shared ZKNative Pattern</h2>
        <div className="font-mono text-sm text-gray-300 space-y-2">
          <div>Frontend generates Groth16 proof in browser</div>
          <div className="pl-4">↓ contract.execute(contextId, proof, publicSignals)</div>
          <div>Consumer contract enforces root, nullifier, and business logic</div>
          <div className="pl-4">↓ verifyProof(proof, publicSignals)</div>
          <div>ZKNativeVerifier dispatches to PolkaVM native verifier</div>
          <div className="pl-4">↓ arkworks Groth16 verification in Rust</div>
          <div className="text-polkadot-pink">One verifier, many privacy-preserving contracts</div>
        </div>
      </section>
    </div>
  );
}
