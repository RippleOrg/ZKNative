#!/usr/bin/env ts-node
/**
 * scripts/benchmark.ts
 *
 * Benchmark ZKNativeVerifier gas usage on Polkadot Hub Testnet.
 * Compares PVM Rust backend vs Solidity pairing backend.
 *
 * Usage: PRIVATE_KEY=0x... VERIFIER_ADDRESS=0x... npx ts-node scripts/benchmark.ts
 */

import { createPublicClient, createWalletClient, http, parseAbi, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { POLKADOT_HUB_WESTEND } from '../frontend/src/lib/polkadot';

const VERIFIER_ADDRESS = (process.env.VERIFIER_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;
const PRIVATE_KEY = (process.env.PRIVATE_KEY ?? '') as `0x${string}`;

const VERIFIER_ABI = parseAbi([
  'function verifyAndRecord(tuple(uint256[2] a, uint256[2][2] b, uint256[2] c) proof, uint256[] publicSignals) returns (bool)',
  'function lastVerificationGas() view returns (uint256)',
  'function switchBackend(bool usePVM)',
  'function usePVMBackend() view returns (bool)',
]);

// BN254 G1 generator (structural — will not pass pairing; used for gas benchmarking)
const STRUCTURAL_PROOF = {
  a: [1n, 2n] as [bigint, bigint],
  b: [
    [10857046999023057135944570762232829481370756359578518086990519993285655852781n,
     11559732032986387107991004021392285783925812861821192530917403151452391805634n],
    [8495653923123431417604973247489272438418190587263600148770280649306958101930n,
     4082367875863433681332203403145435568316851327593401208105741076214120093531n],
  ] as [[bigint, bigint], [bigint, bigint]],
  c: [1n, 2n] as [bigint, bigint],
};

const PUBLIC_SIGNALS = [1n, 2n, 1n, 1n];

async function main() {
  if (!PRIVATE_KEY) {
    console.error('Set PRIVATE_KEY environment variable');
    process.exit(1);
  }

  const account = privateKeyToAccount(PRIVATE_KEY);
  const publicClient = createPublicClient({
    chain: POLKADOT_HUB_WESTEND as any,
    transport: http(),
  });
  const walletClient = createWalletClient({
    account,
    chain: POLKADOT_HUB_WESTEND as any,
    transport: http(),
  });

  console.log('=== ZKNative Gas Benchmark ===');
  console.log('Verifier:', VERIFIER_ADDRESS);

  const results: Array<{ backend: string; gasUsed: bigint }> = [];

  for (const usePVM of [true, false]) {
    // Switch backend
    await walletClient.writeContract({
      address: VERIFIER_ADDRESS,
      abi: VERIFIER_ABI,
      functionName: 'switchBackend',
      args: [usePVM],
    });
    await new Promise((r) => setTimeout(r, 3000));

    const backendName = usePVM ? 'PVM Rust' : 'Solidity';
    console.log(`\nTesting ${backendName} backend...`);

    const hash = await walletClient.writeContract({
      address: VERIFIER_ADDRESS,
      abi: VERIFIER_ABI,
      functionName: 'verifyAndRecord',
      args: [STRUCTURAL_PROOF, PUBLIC_SIGNALS],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const gasUsed = await publicClient.readContract({
      address: VERIFIER_ADDRESS,
      abi: VERIFIER_ABI,
      functionName: 'lastVerificationGas',
    });

    console.log(`  tx gas: ${receipt.gasUsed.toLocaleString()}`);
    console.log(`  verification gas: ${gasUsed.toLocaleString()}`);
    results.push({ backend: backendName, gasUsed });
  }

  if (results.length === 2) {
    const [pvm, sol] = results;
    const speedup = Number(sol.gasUsed) / Number(pvm.gasUsed);
    console.log(`\nSpeedup: ${speedup.toFixed(2)}× (PVM Rust vs Solidity)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
