'use client';

export default function ResultsPage() {
  const proposals = [
    {
      id: 1,
      title: 'Upgrade ZK verifier to v2',
      status: 'Active',
      votesFor: 147,
      votesAgainst: 23,
      votesAbstain: 8,
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      title: 'Add cross-parachain XCM voting',
      status: 'Passed',
      votesFor: 312,
      votesAgainst: 45,
      votesAbstain: 12,
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Voting Results</h1>
      <p className="text-gray-400 mb-8">
        All votes are private — only the aggregate tallies are public.
        Nullifiers prevent double-voting without revealing voter identity.
      </p>

      <div className="space-y-6">
        {proposals.map((p) => (
          <ProposalCard key={p.id} proposal={p} />
        ))}
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
}: {
  proposal: {
    id: number;
    title: string;
    status: string;
    votesFor: number;
    votesAgainst: number;
    votesAbstain: number;
    endTime: Date;
  };
}) {
  const total = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const forPct = total > 0 ? (proposal.votesFor / total) * 100 : 0;
  const againstPct = total > 0 ? (proposal.votesAgainst / total) * 100 : 0;
  const abstainPct = total > 0 ? (proposal.votesAbstain / total) * 100 : 0;

  return (
    <div className="bg-polkadot-gray rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs text-gray-500 mr-2">#{proposal.id}</span>
          <span className="font-semibold">{proposal.title}</span>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            proposal.status === 'Active'
              ? 'bg-blue-900/50 text-blue-400'
              : 'bg-green-900/50 text-green-400'
          }`}
        >
          {proposal.status}
        </span>
      </div>

      {/* Vote bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-3 bg-polkadot-black">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${forPct}%` }}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${againstPct}%` }}
        />
        <div
          className="bg-gray-500 transition-all"
          style={{ width: `${abstainPct}%` }}
        />
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-green-400">✅ For: {proposal.votesFor}</span>
        <span className="text-red-400">❌ Against: {proposal.votesAgainst}</span>
        <span className="text-gray-400">⚪ Abstain: {proposal.votesAbstain}</span>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Total votes: {total} · Ends: {proposal.endTime.toLocaleDateString()}
      </p>
    </div>
  );
}
