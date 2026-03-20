import Link from 'next/link';

import { PrivateVotingConsole } from '@/components/private-voting-console';

export default function VotePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/use-cases" className="text-sm text-polkadot-pink hover:text-white transition-colors">
          ← All Use Cases
        </Link>
      </div>
      <PrivateVotingConsole />
    </div>
  );
}
