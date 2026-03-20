import type { Metadata } from 'next';
import Link from 'next/link';

import { WalletStatus } from '@/components/wallet-status';

import './globals.css';

export const metadata: Metadata = {
  title: 'ZKNative — Private ZK Apps on Polkadot',
  description:
    'A native Rust ZK verifier on Polkadot powering private voting, stealth airdrops, and anonymous access passes via PolkaVM.',
  openGraph: {
    title: 'ZKNative',
    description: 'Private voting, stealth claims, and anonymous access powered by Rust ZK proofs on Polkadot Hub',
    url: 'https://zknative.vercel.app',
    siteName: 'ZKNative',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-polkadot-black text-white min-h-screen font-sans antialiased">
        <header className="border-b border-polkadot-gray px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-polkadot-pink font-bold text-xl tracking-tight">ZKNative</span>
            <span className="text-xs text-gray-500 bg-polkadot-gray px-2 py-0.5 rounded">
              PVM × ZK
            </span>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <nav className="flex flex-wrap gap-4 text-sm text-gray-400 sm:gap-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/vote" className="hover:text-white transition-colors">Vote</Link>
              <Link href="/results" className="hover:text-white transition-colors">Results</Link>
              <Link href="/studio" className="hover:text-white transition-colors">Studio</Link>
              <Link href="/use-cases" className="hover:text-white transition-colors">Use Cases</Link>
              <Link href="/benchmark" className="hover:text-white transition-colors">Benchmark</Link>
            </nav>
            <WalletStatus />
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">{children}</main>
        <footer className="border-t border-polkadot-gray px-6 py-4 text-center text-xs text-gray-600">
          ZKNative — private voting and native Rust verification on Polkadot Hub ·{' '}
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
