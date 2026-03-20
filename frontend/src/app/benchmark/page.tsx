'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const benchmarkData = [
  {
    name: 'Proof Verification',
    'PVM Rust (Polkadot)': 180_000,
    'Solidity (EVM)': 1_850_000,
    'Solidity (Polkadot)': 1_820_000,
  },
  {
    name: 'Pairing Check',
    'PVM Rust (Polkadot)': 150_000,
    'Solidity (EVM)': 1_700_000,
    'Solidity (Polkadot)': 1_680_000,
  },
  {
    name: 'IC Linear Comb.',
    'PVM Rust (Polkadot)': 20_000,
    'Solidity (EVM)': 120_000,
    'Solidity (Polkadot)': 115_000,
  },
];

export default function BenchmarkPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Benchmark Results</h1>
      <p className="mb-8 text-sm text-gray-400 sm:text-base">
        PVM native Rust vs Solidity Groth16 verification.{' '}
        <span className="text-polkadot-pink font-semibold">~10× gas savings</span> when using
        the native Rust verifier via PolkaVM FFI.
      </p>

      <div className="bg-polkadot-gray rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-6">Gas Usage Comparison (lower is better)</h2>
        <div className="h-[280px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benchmarkData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3F" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}
                formatter={(v: number) => [`${v.toLocaleString()} gas`, undefined]}
              />
              <Legend />
              <Bar dataKey="PVM Rust (Polkadot)" fill="#E6007A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Solidity (EVM)" fill="#6b7280" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Solidity (Polkadot)" fill="#374151" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary table */}
      <div className="bg-polkadot-gray rounded-xl p-6">
        <h2 className="font-semibold mb-4">Detailed Results</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className="border-b border-polkadot-black text-gray-400">
                <th className="text-left py-2">Operation</th>
                <th className="text-right py-2 text-polkadot-pink">PVM Rust</th>
                <th className="text-right py-2">Solidity EVM</th>
                <th className="text-right py-2">Speedup</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData.map((row) => (
                <tr key={row.name} className="border-b border-polkadot-black/50">
                  <td className="py-3 text-gray-300">{row.name}</td>
                  <td className="py-3 text-right text-polkadot-pink font-mono">
                    {row['PVM Rust (Polkadot)'].toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono text-gray-400">
                    {row['Solidity (EVM)'].toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-green-400 font-semibold">
                    {(row['Solidity (EVM)'] / row['PVM Rust (Polkadot)']).toFixed(1)}×
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          * Measured on Polkadot Hub Testnet. Gas costs are approximate and depend on proof
          complexity. The PVM Rust verifier uses arkworks on BN254; Solidity uses EIP-197 precompiles.
        </p>
      </div>
    </div>
  );
}
