import Link from 'next/link';

import type { UseCaseConfig } from '@/lib/use-cases';

export function UseCaseCard({
  config,
  ctaLabel = 'Explore Use Case',
  hrefOverride,
}: {
  config: UseCaseConfig;
  ctaLabel?: string;
  hrefOverride?: string;
}) {
  return (
    <div className="bg-polkadot-gray rounded-xl p-6 border border-polkadot-gray hover:border-polkadot-pink transition-colors">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-3xl">{config.icon}</span>
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">{config.eyebrow}</span>
      </div>

      <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
      <p className="text-sm text-gray-400 mb-4">{config.description}</p>

      <div className="mb-5 grid gap-3 text-xs sm:grid-cols-2">
        {config.metrics.slice(0, 2).map((metric) => (
          <div key={metric.label} className="rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 p-3">
            <p className="text-gray-500 mb-1">{metric.label}</p>
            <p className="text-white font-medium">{metric.value}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mb-5">{config.benchmark}</p>

      <Link
        href={hrefOverride ?? config.href}
        className="inline-flex items-center text-polkadot-pink hover:text-white transition-colors text-sm font-semibold"
      >
        {ctaLabel} →
      </Link>
    </div>
  );
}
