'use client';

import { useState } from 'react';

import { UseCaseCard } from '@/components/use-case-card';
import { UseCaseDemo } from '@/components/use-case-demo';
import {
  USE_CASES_BY_SLUG,
  type BuiltInUseCaseSlug,
  type UseCaseAction,
  type UseCaseConfig,
  type UseCaseMetric,
  type UseCaseScenario,
} from '@/lib/use-cases';

interface StudioDraft {
  icon: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  navLabel: string;
  routePath: string;
  description: string;
  privacyPromise: string;
  contractCall: string;
  contractSummary: string;
  scenarioLabel: string;
  contextLabel: string;
  actionLabel: string;
  proofButtonLabel: string;
  submitButtonLabel: string;
  successTitle: string;
  successDescription: string;
  successLinkHref: string;
  successLinkLabel: string;
  benchmark: string;
  metrics: UseCaseMetric[];
  actionOptions: UseCaseAction[];
  scenarios: UseCaseScenario[];
  proofChecklistText: string;
  technicalHighlightsText: string;
}

const BUILT_IN_TEMPLATES: Array<{ key: BuiltInUseCaseSlug; label: string }> = [
  { key: 'vote', label: 'Voting Template' },
  { key: 'airdrop', label: 'Airdrop Template' },
  { key: 'access', label: 'Access Template' },
];

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'custom-use-case';
}

function startCase(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function pascalCase(value: string) {
  return startCase(value).replace(/\s+/g, '') || 'CustomUseCase';
}

function splitTextBlock(value: string, fallback: string[]) {
  const items = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
}

function cloneMetrics(metrics: UseCaseMetric[]) {
  return metrics.map((metric) => ({ ...metric }));
}

function cloneActions(actions: UseCaseAction[]) {
  return actions.map((action) => ({ ...action }));
}

function cloneScenarios(scenarios: UseCaseScenario[]) {
  return scenarios.map((scenario) => ({ ...scenario }));
}

function createDraftFromConfig(config: UseCaseConfig): StudioDraft {
  return {
    icon: config.icon,
    eyebrow: config.eyebrow,
    title: config.title,
    shortTitle: config.shortTitle,
    navLabel: config.navLabel,
    routePath: config.href.replace(/^\//, ''),
    description: config.description,
    privacyPromise: config.privacyPromise,
    contractCall: config.contractCall,
    contractSummary: config.contractSummary,
    scenarioLabel: config.scenarioLabel,
    contextLabel: config.contextLabel,
    actionLabel: config.actionLabel,
    proofButtonLabel: config.proofButtonLabel,
    submitButtonLabel: config.submitButtonLabel,
    successTitle: config.successTitle,
    successDescription: config.successDescription,
    successLinkHref: config.successLinkHref,
    successLinkLabel: config.successLinkLabel,
    benchmark: config.benchmark,
    metrics: cloneMetrics(config.metrics),
    actionOptions: cloneActions(config.actionOptions),
    scenarios: cloneScenarios(config.scenarios),
    proofChecklistText: config.proofChecklist.join('\n'),
    technicalHighlightsText: config.technicalHighlights.join('\n'),
  };
}

function createBlankDraft(): StudioDraft {
  return {
    icon: '🧪',
    eyebrow: 'Custom Privacy App',
    title: 'Private Bounty Claims',
    shortTitle: 'Bounties',
    navLabel: 'Bounties',
    routePath: 'private-bounties',
    description:
      'Let builders claim milestones or rewards without exposing which allowlisted contributor wallet qualified.',
    privacyPromise:
      'The contract learns only the campaign and claim type while the proving wallet stays hidden behind a Merkle membership proof and campaign-scoped nullifier.',
    contractCall: 'PrivateBounty.claimBounty(campaignId, claimType, proof, publicSignals)',
    contractSummary:
      'The consumer contract checks the campaign root, enforces one claim per nullifier, and releases the reward only after ZKNativeVerifier accepts the proof.',
    scenarioLabel: 'Campaign',
    contextLabel: 'campaignId',
    actionLabel: 'claimType',
    proofButtonLabel: 'Generate Custom Proof',
    submitButtonLabel: 'Execute Custom Use Case',
    successTitle: 'Custom use case executed',
    successDescription:
      'Your draft flow completed and is ready to export into a real ZKNative integration.',
    successLinkHref: '/use-cases',
    successLinkLabel: 'Return to Studio',
    benchmark: 'Same verifier, new business logic. Only the consumer contract and circuit semantics change.',
    metrics: [
      { label: 'Proof System', value: 'Groth16 / BN254' },
      { label: 'Nullifier Scope', value: 'Per user, per campaign' },
      { label: 'On-Chain Action', value: 'Claim gated reward' },
      { label: 'Verifier Path', value: 'Solidity -> PVM Rust' },
    ],
    actionOptions: [
      {
        code: 0,
        label: 'Milestone A',
        description: 'Redeem the first claim type privately.',
      },
      {
        code: 1,
        label: 'Milestone B',
        description: 'Claim a larger reward without revealing the proving wallet.',
      },
    ],
    scenarios: [
      {
        id: 'season-1',
        label: 'Season 1',
        summary: 'Launch campaign with a gated contributor reward pool.',
        contextValue: 1,
        settlement: 'One private claim is released for this campaign.',
      },
      {
        id: 'season-2',
        label: 'Season 2',
        summary: 'Follow-up program with a separate nullifier scope and allowlist root.',
        contextValue: 2,
        settlement: 'A distinct campaign can settle without replaying previous proofs.',
      },
    ],
    proofChecklistText: [
      'Prove allowlist membership for the campaign.',
      'Bind the proof to a custom context-specific nullifier.',
      'Reveal only the action type needed for settlement.',
    ].join('\n'),
    technicalHighlightsText: [
      'Keep the public signal layout aligned with your consumer contract checks.',
      'Reuse ZKNativeVerifier for any Groth16-compatible flow that needs roots and nullifiers.',
      'Let business logic evolve in Solidity while the heavy verification runs in native Rust.',
    ].join('\n'),
  };
}

function buildConfigFromDraft(draft: StudioDraft): UseCaseConfig {
  const slug = slugify(draft.routePath || draft.title);
  const title = draft.title.trim() || 'Custom Use Case';
  const shortTitle = draft.shortTitle.trim() || startCase(slug);
  const navLabel = draft.navLabel.trim() || shortTitle;

  return {
    slug,
    href: `/${slug}`,
    navLabel,
    icon: draft.icon.trim() || '🧪',
    eyebrow: draft.eyebrow.trim() || 'Custom Privacy App',
    title,
    shortTitle,
    description: draft.description.trim(),
    privacyPromise: draft.privacyPromise.trim(),
    contractCall: draft.contractCall.trim(),
    contractSummary: draft.contractSummary.trim(),
    scenarioLabel: draft.scenarioLabel.trim() || 'Scenario',
    contextLabel: draft.contextLabel.trim() || 'contextId',
    actionLabel: draft.actionLabel.trim() || 'actionId',
    proofButtonLabel: draft.proofButtonLabel.trim() || 'Generate Proof',
    submitButtonLabel: draft.submitButtonLabel.trim() || 'Execute Use Case',
    successTitle: draft.successTitle.trim() || 'Use case executed',
    successDescription: draft.successDescription.trim(),
    successLinkHref: draft.successLinkHref.trim() || '/use-cases',
    successLinkLabel: draft.successLinkLabel.trim() || 'Back to Studio',
    benchmark: draft.benchmark.trim(),
    metrics:
      draft.metrics.filter((metric) => metric.label.trim() || metric.value.trim()).length > 0
        ? draft.metrics.filter((metric) => metric.label.trim() || metric.value.trim())
        : createBlankDraft().metrics,
    actionOptions:
      draft.actionOptions.filter((action) => action.label.trim() || action.description.trim()).length > 0
        ? draft.actionOptions.filter((action) => action.label.trim() || action.description.trim())
        : createBlankDraft().actionOptions,
    scenarios:
      draft.scenarios.filter((scenario) => scenario.label.trim() || scenario.summary.trim()).length > 0
        ? draft.scenarios.filter((scenario) => scenario.label.trim() || scenario.summary.trim())
        : createBlankDraft().scenarios,
    proofChecklist: splitTextBlock(draft.proofChecklistText, createBlankDraft().proofChecklistText.split('\n')),
    technicalHighlights: splitTextBlock(
      draft.technicalHighlightsText,
      createBlankDraft().technicalHighlightsText.split('\n')
    ),
  };
}

function formatConfigSnippet(config: UseCaseConfig) {
  return `import type { UseCaseConfig } from '@/lib/use-cases';

export const customUseCase: UseCaseConfig = ${JSON.stringify(config, null, 2)};
`;
}

function formatRouteSnippet(config: UseCaseConfig) {
  const componentName = `${pascalCase(config.shortTitle || config.title)}Page`;

  return `import { UseCaseDemo } from '@/components/use-case-demo';
import { customUseCase } from '@/lib/custom-use-case';

export default function ${componentName}() {
  return <UseCaseDemo config={customUseCase} />;
}
`;
}

function formatContractGuide(config: UseCaseConfig) {
  return `1. Consumer contract:
   Implement ${config.contractCall.split('(')[0]} and verify these checks before calling ZKNativeVerifier:
   - publicSignals[0] matches the active Merkle root
   - publicSignals[1] nullifier has not been used
   - publicSignals[2] matches ${config.contextLabel}
   - publicSignals[3] matches ${config.actionLabel}

2. Circuit design:
   - Private inputs: secret, wallet identity, Merkle path
   - Public inputs: merkleRoot, nullifier, ${config.contextLabel}, ${config.actionLabel}
   - Nullifier recipe: Poseidon(secret, ${config.contextLabel})

3. Frontend route:
   - Mount UseCase with your exported config
   - Proof generation with snarkjs.fullProve
   - Point submission to ${config.contractCall}
`;
}

function StudioCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-polkadot-gray rounded-xl border border-polkadot-gray p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm font-medium">{label}</span>
        {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-polkadot-pink focus:outline-none"
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-polkadot-pink focus:outline-none"
    />
  );
}

export function UseCaseStudio() {
  const [draft, setDraft] = useState<StudioDraft>(createBlankDraft());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const previewConfig = buildConfigFromDraft(draft);
  const configSnippet = formatConfigSnippet(previewConfig);
  const routeSnippet = formatRouteSnippet(previewConfig);
  const contractGuide = formatContractGuide(previewConfig);

  const updateDraftField = <K extends keyof StudioDraft,>(field: K, value: StudioDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateMetric = (index: number, field: keyof UseCaseMetric, value: string) => {
    setDraft((current) => ({
      ...current,
      metrics: current.metrics.map((metric, metricIndex) =>
        metricIndex === index ? { ...metric, [field]: value } : metric
      ),
    }));
  };

  const updateAction = (index: number, field: keyof UseCaseAction, value: string | number) => {
    setDraft((current) => ({
      ...current,
      actionOptions: current.actionOptions.map((action, actionIndex) =>
        actionIndex === index ? { ...action, [field]: value } : action
      ),
    }));
  };

  const updateScenario = (index: number, field: keyof UseCaseScenario, value: string | number) => {
    setDraft((current) => ({
      ...current,
      scenarios: current.scenarios.map((scenario, scenarioIndex) =>
        scenarioIndex === index ? { ...scenario, [field]: value } : scenario
      ),
    }));
  };

  const addMetric = () => {
    setDraft((current) => ({
      ...current,
      metrics: [...current.metrics, { label: 'New Metric', value: 'Set a value' }],
    }));
  };

  const addAction = () => {
    setDraft((current) => ({
      ...current,
      actionOptions: [
        ...current.actionOptions,
        {
          code: current.actionOptions.length,
          label: `Action ${current.actionOptions.length + 1}`,
          description: 'Describe what this settlement path does.',
        },
      ],
    }));
  };

  const addScenario = () => {
    setDraft((current) => ({
      ...current,
      scenarios: [
        ...current.scenarios,
        {
          id: `scenario-${current.scenarios.length + 1}`,
          label: `Scenario ${current.scenarios.length + 1}`,
          summary: 'Describe the business context bound into the proof.',
          contextValue: current.scenarios.length + 1,
          settlement: 'Explain the on-chain outcome for this scenario.',
        },
      ],
    }));
  };

  const removeMetric = (index: number) => {
    setDraft((current) => ({
      ...current,
      metrics: current.metrics.length > 1 ? current.metrics.filter((_, metricIndex) => metricIndex !== index) : current.metrics,
    }));
  };

  const removeAction = (index: number) => {
    setDraft((current) => ({
      ...current,
      actionOptions:
        current.actionOptions.length > 1
          ? current.actionOptions.filter((_, actionIndex) => actionIndex !== index)
          : current.actionOptions,
    }));
  };

  const removeScenario = (index: number) => {
    setDraft((current) => ({
      ...current,
      scenarios:
        current.scenarios.length > 1
          ? current.scenarios.filter((_, scenarioIndex) => scenarioIndex !== index)
          : current.scenarios,
    }));
  };

  const loadTemplate = (template: BuiltInUseCaseSlug | 'blank') => {
    setDraft(
      template === 'blank'
        ? createBlankDraft()
        : createDraftFromConfig(USE_CASES_BY_SLUG[template])
    );
  };

  const copyText = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1800);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <section className="mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">Developer Studio</p>
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Design your own ZKNative use case</h1>
        <p className="mb-6 max-w-4xl text-base text-gray-300 sm:text-lg">
          Configure a custom privacy-preserving app, preview the full flow, and export the config,
          route, and contract checklist needed to integrate it into ZKNative.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => loadTemplate('blank')}
            className="rounded-full border border-polkadot-pink bg-polkadot-pink/10 px-4 py-2 text-sm font-semibold text-white hover:bg-polkadot-pink/20 transition-colors"
          >
            Start Blank
          </button>
          {BUILT_IN_TEMPLATES.map((template) => (
            <button
              key={template.key}
              onClick={() => loadTemplate(template.key)}
              className="rounded-full border border-polkadot-gray px-4 py-2 text-sm font-semibold text-gray-300 hover:border-polkadot-pink hover:text-white transition-colors"
            >
              {template.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] mb-12">
        <div className="space-y-6">
          <StudioCard title="Core Identity">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Icon">
                <TextInput value={draft.icon} onChange={(value) => updateDraftField('icon', value)} placeholder="🧪" />
              </Field>
              <Field label="Eyebrow">
                <TextInput value={draft.eyebrow} onChange={(value) => updateDraftField('eyebrow', value)} placeholder="Private Rewards" />
              </Field>
              <Field label="Title">
                <TextInput value={draft.title} onChange={(value) => updateDraftField('title', value)} placeholder="Private Bounty Claims" />
              </Field>
              <Field label="Short Title">
                <TextInput value={draft.shortTitle} onChange={(value) => updateDraftField('shortTitle', value)} placeholder="Bounties" />
              </Field>
              <Field label="Nav Label">
                <TextInput value={draft.navLabel} onChange={(value) => updateDraftField('navLabel', value)} placeholder="Bounties" />
              </Field>
              <Field label="Route Path" hint={`/${slugify(draft.routePath || draft.title)}`}>
                <TextInput value={draft.routePath} onChange={(value) => updateDraftField('routePath', value)} placeholder="private-bounties" />
              </Field>
            </div>

            <div className="grid gap-4 mt-4">
              <Field label="Description">
                <TextArea value={draft.description} onChange={(value) => updateDraftField('description', value)} rows={3} />
              </Field>
              <Field label="Privacy Promise">
                <TextArea value={draft.privacyPromise} onChange={(value) => updateDraftField('privacyPromise', value)} rows={3} />
              </Field>
            </div>
          </StudioCard>

          <StudioCard title="Contract Surface">
            <div className="grid gap-4">
              <Field label="Contract Call">
                <TextInput value={draft.contractCall} onChange={(value) => updateDraftField('contractCall', value)} placeholder="PrivateBounty.claimBounty(...)" />
              </Field>
              <Field label="Contract Summary">
                <TextArea value={draft.contractSummary} onChange={(value) => updateDraftField('contractSummary', value)} rows={3} />
              </Field>
              <Field label="Benchmark / One-Liner">
                <TextArea value={draft.benchmark} onChange={(value) => updateDraftField('benchmark', value)} rows={2} />
              </Field>
            </div>
          </StudioCard>

          <StudioCard title="Signal Labels & Outcomes">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Scenario Label">
                <TextInput value={draft.scenarioLabel} onChange={(value) => updateDraftField('scenarioLabel', value)} placeholder="Campaign" />
              </Field>
              <Field label="Context Label">
                <TextInput value={draft.contextLabel} onChange={(value) => updateDraftField('contextLabel', value)} placeholder="campaignId" />
              </Field>
              <Field label="Action Label">
                <TextInput value={draft.actionLabel} onChange={(value) => updateDraftField('actionLabel', value)} placeholder="claimType" />
              </Field>
              <Field label="Proof Button">
                <TextInput value={draft.proofButtonLabel} onChange={(value) => updateDraftField('proofButtonLabel', value)} placeholder="Generate Proof" />
              </Field>
              <Field label="Submit Button">
                <TextInput value={draft.submitButtonLabel} onChange={(value) => updateDraftField('submitButtonLabel', value)} placeholder="Execute Use Case" />
              </Field>
              <Field label="Success Link Label">
                <TextInput value={draft.successLinkLabel} onChange={(value) => updateDraftField('successLinkLabel', value)} placeholder="Return to Studio" />
              </Field>
              <Field label="Success Link Href">
                <TextInput value={draft.successLinkHref} onChange={(value) => updateDraftField('successLinkHref', value)} placeholder="/use-cases" />
              </Field>
            </div>

            <div className="grid gap-4 mt-4">
              <Field label="Success Title">
                <TextInput value={draft.successTitle} onChange={(value) => updateDraftField('successTitle', value)} placeholder="Use case executed" />
              </Field>
              <Field label="Success Description">
                <TextArea value={draft.successDescription} onChange={(value) => updateDraftField('successDescription', value)} rows={3} />
              </Field>
            </div>
          </StudioCard>

          <StudioCard
            title="Metrics"
            action={
              <button
                onClick={addMetric}
                className="text-sm text-polkadot-pink hover:text-white transition-colors"
              >
                + Add Metric
              </button>
            }
          >
            <div className="space-y-3">
              {draft.metrics.map((metric, index) => (
                <div key={`${metric.label}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <TextInput value={metric.label} onChange={(value) => updateMetric(index, 'label', value)} placeholder="Metric label" />
                  <TextInput value={metric.value} onChange={(value) => updateMetric(index, 'value', value)} placeholder="Metric value" />
                  <button
                    onClick={() => removeMetric(index)}
                    className="w-full rounded-lg border border-polkadot-black/50 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-polkadot-pink hover:text-white md:w-auto"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </StudioCard>

          <StudioCard
            title="Scenarios"
            action={
              <button
                onClick={addScenario}
                className="text-sm text-polkadot-pink hover:text-white transition-colors"
              >
                + Add Scenario
              </button>
            }
          >
            <div className="space-y-4">
              {draft.scenarios.map((scenario, index) => (
                <div key={`${scenario.id}-${index}`} className="rounded-xl border border-polkadot-black/50 bg-polkadot-black/30 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Scenario ID">
                      <TextInput value={scenario.id} onChange={(value) => updateScenario(index, 'id', slugify(value))} placeholder="season-1" />
                    </Field>
                    <Field label="Label">
                      <TextInput value={scenario.label} onChange={(value) => updateScenario(index, 'label', value)} placeholder="Season 1" />
                    </Field>
                    <Field label="Context Value">
                      <TextInput value={String(scenario.contextValue)} onChange={(value) => updateScenario(index, 'contextValue', Number(value) || 0)} placeholder="1" />
                    </Field>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeScenario(index)}
                        className="w-full rounded-lg border border-polkadot-black/50 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-polkadot-pink hover:text-white sm:w-auto"
                      >
                        Remove Scenario
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 mt-3">
                    <Field label="Summary">
                      <TextArea value={scenario.summary} onChange={(value) => updateScenario(index, 'summary', value)} rows={2} />
                    </Field>
                    <Field label="Settlement">
                      <TextArea value={scenario.settlement} onChange={(value) => updateScenario(index, 'settlement', value)} rows={2} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </StudioCard>

          <StudioCard
            title="Actions"
            action={
              <button
                onClick={addAction}
                className="text-sm text-polkadot-pink hover:text-white transition-colors"
              >
                + Add Action
              </button>
            }
          >
            <div className="space-y-4">
              {draft.actionOptions.map((action, index) => (
                <div key={`${action.code}-${index}`} className="rounded-xl border border-polkadot-black/50 bg-polkadot-black/30 p-4">
                  <div className="grid gap-3 md:grid-cols-[120px_1fr_auto]">
                    <Field label="Code">
                      <TextInput value={String(action.code)} onChange={(value) => updateAction(index, 'code', Number(value) || 0)} placeholder="0" />
                    </Field>
                    <Field label="Label">
                      <TextInput value={action.label} onChange={(value) => updateAction(index, 'label', value)} placeholder="Milestone A" />
                    </Field>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeAction(index)}
                        className="w-full rounded-lg border border-polkadot-black/50 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-polkadot-pink hover:text-white md:w-auto"
                      >
                        Remove Action
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Field label="Description">
                      <TextArea value={action.description} onChange={(value) => updateAction(index, 'description', value)} rows={2} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </StudioCard>

          <StudioCard title="Proof Checklist & Technical Notes">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Proof Checklist" hint="One line per item">
                <TextArea value={draft.proofChecklistText} onChange={(value) => updateDraftField('proofChecklistText', value)} rows={6} />
              </Field>
              <Field label="Technical Highlights" hint="One line per item">
                <TextArea value={draft.technicalHighlightsText} onChange={(value) => updateDraftField('technicalHighlightsText', value)} rows={6} />
              </Field>
            </div>
          </StudioCard>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 self-start">
          <StudioCard title="Card Preview">
            <UseCaseCard config={previewConfig} ctaLabel="Studio Preview" hrefOverride="/studio" />
          </StudioCard>

          <StudioCard title="Export JSON">
            <button
              onClick={() => copyText('json', JSON.stringify(previewConfig, null, 2))}
              className="mb-4 w-full rounded-lg border border-polkadot-pink px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-polkadot-pink/10 sm:w-auto"
            >
              {copiedKey === 'json' ? 'Copied JSON' : 'Copy JSON'}
            </button>
            <pre className="overflow-x-auto rounded-xl bg-polkadot-black/40 p-3 text-[11px] text-gray-300 sm:p-4 sm:text-xs">
              {JSON.stringify(previewConfig, null, 2)}
            </pre>
          </StudioCard>

          <StudioCard title="Export TypeScript">
            <button
              onClick={() => copyText('config', configSnippet)}
              className="mb-4 w-full rounded-lg border border-polkadot-pink px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-polkadot-pink/10 sm:w-auto"
            >
              {copiedKey === 'config' ? 'Copied Config Snippet' : 'Copy Config Snippet'}
            </button>
            <pre className="overflow-x-auto rounded-xl bg-polkadot-black/40 p-3 text-[11px] text-gray-300 sm:p-4 sm:text-xs">
              {configSnippet}
            </pre>
          </StudioCard>

          <StudioCard title="Export Route File">
            <button
              onClick={() => copyText('route', routeSnippet)}
              className="mb-4 w-full rounded-lg border border-polkadot-pink px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-polkadot-pink/10 sm:w-auto"
            >
              {copiedKey === 'route' ? 'Copied Route Snippet' : 'Copy Route Snippet'}
            </button>
            <pre className="overflow-x-auto rounded-xl bg-polkadot-black/40 p-3 text-[11px] text-gray-300 sm:p-4 sm:text-xs">
              {routeSnippet}
            </pre>
          </StudioCard>

          <StudioCard title="Integration Guide">
            <button
              onClick={() => copyText('guide', contractGuide)}
              className="mb-4 w-full rounded-lg border border-polkadot-pink px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-polkadot-pink/10 sm:w-auto"
            >
              {copiedKey === 'guide' ? 'Copied Guide' : 'Copy Guide'}
            </button>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-polkadot-black/40 p-3 text-[11px] text-gray-300 sm:p-4 sm:text-xs">
              {contractGuide}
            </pre>
          </StudioCard>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Live Preview</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Run the full custom flow before you export it</h2>
          </div>
          {/* <p className="text-sm text-gray-400 max-w-xl">
            This preview stays in demo mode, but it uses the same interactive component as the built-in ZKNative use cases.
          </p> */}
        </div>

        <UseCaseDemo
          config={previewConfig}
          backHref="/studio"
          backLabel="Studio"
          successLinkHrefOverride="/studio"
          successLinkLabelOverride="Keep Editing"
        />
      </section>
    </div>
  );
}
