'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { UseCaseAction, UseCaseConfig, UseCaseScenario } from '@/lib/use-cases';

type Step = 'connect' | 'proof' | 'submit' | 'done';
type ProofStatus = 'idle' | 'generating' | 'ready';

function hashSeed(seed: string) {
  const chunk = (input: string, salt: number) => {
    let value = (0x811c9dc5 ^ salt) >>> 0;

    for (const character of input) {
      value ^= character.charCodeAt(0) + salt;
      value = Math.imul(value, 0x01000193) >>> 0;
    }

    return value.toString(16).padStart(8, '0');
  };

  return Array.from({ length: 8 }, (_, index) => chunk(`${seed}:${index}`, index + 1)).join('');
}

function buildSignalPreview(
  config: UseCaseConfig,
  scenario: UseCaseScenario,
  action: UseCaseAction | null
) {
  const actionCode = action?.code ?? 0;
  const baseSeed = `${config.slug}:${scenario.id}:${actionCode}`;
  const proofTimeMs = 820 + ((scenario.contextValue * 137 + actionCode * 211) % 740);
  const gasEstimate = 168_000 + ((scenario.contextValue * 2_110 + actionCode * 6_100) % 42_000);

  return {
    merkleRoot: `0x${hashSeed(`${baseSeed}:root`)}`,
    nullifier: `0x${hashSeed(`${baseSeed}:nullifier`)}`,
    contextValue: String(scenario.contextValue),
    actionValue: String(actionCode),
    proofTimeLabel: `${proofTimeMs}ms`,
    gasEstimateLabel: `${gasEstimate.toLocaleString()} gas`,
  };
}

function buildTxHash(config: UseCaseConfig, scenario: UseCaseScenario, action: UseCaseAction) {
  return `0x${hashSeed(`${config.slug}:${scenario.id}:${action.code}:tx`)}`;
}

function StepBadge({
  active,
  complete,
  index,
}: {
  active: boolean;
  complete: boolean;
  index: number;
}) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
        active
          ? 'bg-polkadot-pink text-white'
          : complete
          ? 'bg-green-600 text-white'
          : 'bg-polkadot-gray text-gray-500'
      }`}
    >
      {index}
    </div>
  );
}

export function UseCaseDemo({
  config,
  backHref = '/use-cases',
  backLabel = 'All Use Cases',
  successLinkHrefOverride,
  successLinkLabelOverride,
}: {
  config: UseCaseConfig;
  backHref?: string;
  backLabel?: string;
  successLinkHrefOverride?: string;
  successLinkLabelOverride?: string;
}) {
  const [step, setStep] = useState<Step>('connect');
  const [proofStatus, setProofStatus] = useState<ProofStatus>('idle');
  const [selectedScenarioId, setSelectedScenarioId] = useState(config.scenarios[0]?.id ?? '');
  const [selectedActionCode, setSelectedActionCode] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedScenario =
    config.scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? config.scenarios[0];
  const selectedAction =
    config.actionOptions.find((action) => action.code === selectedActionCode) ?? null;
  const signalPreview = buildSignalPreview(config, selectedScenario, selectedAction);

  const generateProof = async () => {
    if (!selectedAction) return;
    setProofStatus('generating');
    await new Promise((resolve) => setTimeout(resolve, 1250));
    setProofStatus('ready');
  };

  const submitProof = async () => {
    if (!selectedAction) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setTxHash(buildTxHash(config, selectedScenario, selectedAction));
    setSubmitting(false);
    setStep('done');
  };

  const resetFlow = () => {
    setProofStatus('idle');
    setSelectedActionCode(null);
    setTxHash(null);
    setSubmitting(false);
    setStep('proof');
  };

  const chooseScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setProofStatus('idle');
    setTxHash(null);
  };

  const chooseAction = (actionCode: number) => {
    setSelectedActionCode(actionCode);
    setProofStatus('idle');
    setTxHash(null);
  };

  const stepOrder: Step[] = ['connect', 'proof', 'submit', 'done'];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 sm:mb-10">
        <Link href={backHref} className="text-sm text-polkadot-pink hover:text-white transition-colors">
          ← {backLabel}
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
          <div>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="text-4xl sm:text-5xl">{config.icon}</span>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">{config.eyebrow}</p>
                <h1 className="text-3xl font-bold sm:text-4xl">{config.title}</h1>
              </div>
            </div>
            <p className="mb-4 text-base text-gray-300 sm:text-lg">{config.description}</p>
            <p className="text-sm text-gray-400">{config.privacyPromise}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {config.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-polkadot-gray bg-polkadot-gray/60 p-4"
              >
                <p className="text-xs text-gray-500 mb-2">{metric.label}</p>
                <p className="font-semibold text-sm text-white">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="bg-polkadot-gray rounded-xl p-6 border border-polkadot-gray">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {stepOrder.map((stepName, index) => (
                <div key={stepName} className="flex items-center">
                  <StepBadge
                    active={step === stepName}
                    complete={stepOrder.indexOf(step) > index}
                    index={index + 1}
                  />
                  {index < stepOrder.length - 1 && <div className="mx-1 h-px w-4 bg-polkadot-black sm:mx-2 sm:w-8" />}
                </div>
              ))}
              <span className="w-full pt-1 text-sm capitalize text-gray-400 sm:ml-2 sm:w-auto sm:pt-0">{step}</span>
            </div>

            {step === 'connect' && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Step 1: Connect Eligible Identity</h2>
                <p className="text-sm text-gray-400 mb-6">
                  Connect a wallet, then generate a proof that you belong to the right
                  allowlist without revealing which address qualified.
                </p>

                <div className="grid gap-3 md:grid-cols-3 mb-6">
                  {config.proofChecklist.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 p-4 text-sm text-gray-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep('proof')}
                  className="w-full bg-polkadot-pink hover:bg-polkadot-pink-dark text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Connect Wallet and Generate Proof →
                </button>
              </div>
            )}

            {step === 'proof' && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Step 2: Generate Context-Bound Proof</h2>
                <p className="text-sm text-gray-400 mb-6">
                  Pick a live scenario and an action. The proof binds your hidden identity to that
                  exact context so the nullifier cannot be replayed elsewhere.
                </p>

                <div className="mb-6">
                  <p className="text-sm font-medium mb-3">{config.scenarioLabel}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {config.scenarios.map((scenario) => (
                      <button
                        key={scenario.id}
                        onClick={() => chooseScenario(scenario.id)}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          selectedScenario.id === scenario.id
                            ? 'border-polkadot-pink bg-polkadot-black/40'
                            : 'border-polkadot-black/50 hover:border-polkadot-pink'
                        }`}
                      >
                        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-semibold">{scenario.label}</span>
                          <span className="text-xs text-gray-500">{config.contextLabel}: {scenario.contextValue}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{scenario.summary}</p>
                        <p className="text-xs text-gray-500">{scenario.settlement}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium mb-3">{config.actionLabel}</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {config.actionOptions.map((action) => (
                      <button
                        key={action.code}
                        onClick={() => chooseAction(action.code)}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          selectedAction?.code === action.code
                            ? 'border-polkadot-pink bg-polkadot-pink/10'
                            : 'border-polkadot-black/50 hover:border-polkadot-pink'
                        }`}
                      >
                        <p className="font-semibold mb-2">{action.label}</p>
                        <p className="text-sm text-gray-400">{action.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateProof}
                  disabled={!selectedAction || proofStatus === 'generating'}
                  className="w-full bg-polkadot-pink hover:bg-polkadot-pink-dark disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {proofStatus === 'generating' ? '⏳ Generating proof...' : `🔐 ${config.proofButtonLabel}`}
                </button>

                {proofStatus === 'ready' && (
                  <div className="mt-4 rounded-xl border border-green-700 bg-green-900/30 p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold text-green-400">Proof ready for submission</p>
                      <span className="text-xs text-green-300">{signalPreview.proofTimeLabel}</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div className="rounded-lg bg-polkadot-black/40 p-3">
                        <p className="text-xs text-gray-500 mb-1">Merkle Root</p>
                        <code className="text-xs text-white break-all">{signalPreview.merkleRoot}</code>
                      </div>
                      <div className="rounded-lg bg-polkadot-black/40 p-3">
                        <p className="text-xs text-gray-500 mb-1">Nullifier</p>
                        <code className="text-xs text-white break-all">{signalPreview.nullifier}</code>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep('submit')}
                  disabled={proofStatus !== 'ready'}
                  className="w-full mt-4 border border-polkadot-gray hover:border-polkadot-pink disabled:opacity-30 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Continue to Execution →
                </button>
              </div>
            )}

            {step === 'submit' && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Step 3: Execute On-Chain</h2>
                <p className="text-sm text-gray-400 mb-6">
                  The consumer contract validates the public signals, then forwards the proof to the
                  native Rust verifier on PolkaVM.
                </p>

                <div className="grid gap-3 md:grid-cols-2 mb-6">
                  <div className="rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 p-4">
                    <p className="text-xs text-gray-500 mb-2">{config.scenarioLabel}</p>
                    <p className="font-semibold">{selectedScenario.label}</p>
                    <p className="text-sm text-gray-400 mt-2">{selectedScenario.summary}</p>
                  </div>
                  <div className="rounded-lg border border-polkadot-black/50 bg-polkadot-black/40 p-4">
                    <p className="text-xs text-gray-500 mb-2">{config.actionLabel}</p>
                    <p className="font-semibold">{selectedAction?.label ?? 'No action selected'}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {selectedAction?.description ?? 'Pick an action before generating the proof.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-polkadot-black/50 bg-polkadot-black/40 p-4 mb-6">
                  <p className="text-xs text-gray-500 mb-2">Contract Call</p>
                  <code className="text-sm text-polkadot-pink break-all">{config.contractCall}</code>
                  <p className="text-sm text-gray-400 mt-3">{config.contractSummary}</p>
                </div>

                <button
                  onClick={submitProof}
                  disabled={!selectedAction || submitting}
                  className="w-full bg-polkadot-pink hover:bg-polkadot-pink-dark disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {submitting ? '⏳ Executing...' : config.submitButtonLabel}
                </button>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center">
                <div className="mb-4 text-4xl sm:text-5xl">✅</div>
                <h2 className="text-2xl font-bold mb-3">{config.successTitle}</h2>
                <p className="text-gray-400 text-sm mb-5">{config.successDescription}</p>
                {txHash && (
                  <code className="block text-xs text-polkadot-pink break-all rounded-lg bg-polkadot-black/40 p-4 mb-5">
                    {txHash}
                  </code>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href={successLinkHrefOverride ?? config.successLinkHref}
                    className="bg-polkadot-pink hover:bg-polkadot-pink-dark text-white px-5 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {successLinkLabelOverride ?? config.successLinkLabel}
                  </Link>
                  <button
                    onClick={resetFlow}
                    className="border border-polkadot-gray hover:border-polkadot-pink text-white px-5 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Run Another Scenario
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-polkadot-gray rounded-xl p-6 border border-polkadot-gray">
            <h3 className="font-semibold mb-4">Current Signal Preview</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-polkadot-black/40 p-3">
                <p className="text-xs text-gray-500 mb-1">publicSignals[0] · merkleRoot</p>
                <code className="text-xs text-white break-all">{signalPreview.merkleRoot}</code>
              </div>
              <div className="rounded-lg bg-polkadot-black/40 p-3">
                <p className="text-xs text-gray-500 mb-1">publicSignals[1] · nullifier</p>
                <code className="text-xs text-white break-all">{signalPreview.nullifier}</code>
              </div>
              <div className="rounded-lg bg-polkadot-black/40 p-3">
                <p className="text-xs text-gray-500 mb-1">publicSignals[2] · {config.contextLabel}</p>
                <code className="text-xs text-white">{signalPreview.contextValue}</code>
              </div>
              <div className="rounded-lg bg-polkadot-black/40 p-3">
                <p className="text-xs text-gray-500 mb-1">publicSignals[3] · {config.actionLabel}</p>
                <code className="text-xs text-white">{signalPreview.actionValue}</code>
              </div>
            </div>
          </div>

          <div className="bg-polkadot-gray rounded-xl p-6 border border-polkadot-gray">
            <h3 className="font-semibold mb-4">Execution Path</h3>
            <div className="space-y-2 break-words font-mono text-xs text-gray-300 sm:text-sm">
              <div>Frontend builds witness + proof in browser</div>
              <div className="pl-4">↓ {config.contractCall.split('(')[0]}</div>
              <div>Consumer contract validates context + nullifier</div>
              <div className="pl-4">↓ verifyProof(proof, publicSignals)</div>
              <div>ZKNativeVerifier dispatches to PolkaVM precompile</div>
              <div className="pl-4">↓ native arkworks Groth16</div>
              <div className="text-polkadot-pink">
                {signalPreview.gasEstimateLabel} · {signalPreview.proofTimeLabel}
              </div>
            </div>
          </div>

          <div className="bg-polkadot-gray rounded-xl p-6 border border-polkadot-gray">
            <h3 className="font-semibold mb-4">Why This Fits ZKNative</h3>
            <div className="space-y-3">
              {config.technicalHighlights.map((item) => (
                <div key={item} className="rounded-lg bg-polkadot-black/40 p-3 text-sm text-gray-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
