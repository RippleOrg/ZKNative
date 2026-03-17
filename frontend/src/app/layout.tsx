import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZKNative — Private Voting on Polkadot',
  description:
    'The first ZK proof verifier running in native Rust on a blockchain, callable from Solidity via PolkaVM.',
  openGraph: {
    title: 'ZKNative',
    description: 'Private on-chain voting powered by Rust ZK proofs on Polkadot Hub',
    url: 'https://zknative.vercel.app',
    siteName: 'ZKNative',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-polkadot-black text-white min-h-screen font-sans antialiased">
        <header className="border-b border-polkadot-gray px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-polkadot-pink font-bold text-xl tracking-tight">ZKNative</span>
            <span className="text-xs text-gray-500 bg-polkadot-gray px-2 py-0.5 rounded">
              PVM × ZK
            </span>
          </div>
          <nav className="flex gap-6 text-sm text-gray-400">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <a href="/vote" className="hover:text-white transition-colors">Vote</a>
            <a href="/results" className="hover:text-white transition-colors">Results</a>
            <a href="/benchmark" className="hover:text-white transition-colors">Benchmark</a>
          </nav>
        </header>
        <main className="container mx-auto px-6 py-8">{children}</main>
        <footer className="border-t border-polkadot-gray px-6 py-4 text-center text-xs text-gray-600">
          ZKNative — Polkadot Solidity Hackathon · Track 2: PVM Smart Contracts ·{' '}
          <a
            href="https://discord.gg/WWgzkDfPQF"
            target="_blank"
            rel="noopener noreferrer"
            className="text-polkadot-pink hover:underline"
          >
            OpenGuild Discord
          </a>
        </footer>
      </body>
    </html>
  );
}
