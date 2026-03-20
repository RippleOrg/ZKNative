#!/usr/bin/env ts-node
/**
 * scripts/generate-proof.ts
 *
 * Generate a Groth16 ZK proof for the voting eligibility circuit.
 * Usage: npx ts-node scripts/generate-proof.ts [proposalId] [voteChoice]
 */

import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { buildPoseidon } from 'circomlibjs';

const BUILD_DIR = path.join(__dirname, '..', 'circuits', 'build');
const WASM_PATH = path.join(BUILD_DIR, 'voting_eligibility_js', 'voting_eligibility.wasm');
const ZKEY_PATH = path.join(BUILD_DIR, 'voting_eligibility_final.zkey');
const VK_PATH = path.join(BUILD_DIR, 'verification_key.json');

const MERKLE_DEPTH = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBigInt(): bigint {
  return BigInt('0x' + crypto.randomBytes(31).toString('hex'));
}

function toPoseidonBigInt(poseidon: any, value: any): bigint {
  return BigInt(poseidon.F.toString(value));
}

function mockMerklePath(): { pathElements: string[]; pathIndices: number[] } {
  return {
    pathElements: Array.from({ length: MERKLE_DEPTH }, () => randomBigInt().toString()),
    pathIndices: Array.from({ length: MERKLE_DEPTH }, () => Math.random() > 0.5 ? 1 : 0),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const proposalId = BigInt(process.argv[2] ?? '1');
  const voteChoice = Number(process.argv[3] ?? '1');

  if (![0, 1, 2].includes(voteChoice)) {
    console.error('voteChoice must be 0 (against), 1 (for), or 2 (abstain)');
    process.exit(1);
  }

  if (!fs.existsSync(WASM_PATH) || !fs.existsSync(ZKEY_PATH)) {
    console.error(
      '❌ Circuit artifacts not found. Run circuits/compile.sh first.\n' +
      `   Expected:\n   ${WASM_PATH}\n   ${ZKEY_PATH}`
    );
    process.exit(1);
  }

  const secret = randomBigInt();
  const voterAddress = randomBigInt(); // In production, derive from connected wallet
  const { pathElements, pathIndices } = mockMerklePath();

  const poseidon = await buildPoseidon();
  let current = toPoseidonBigInt(poseidon, poseidon([secret, voterAddress]));

  for (let i = 0; i < MERKLE_DEPTH; i++) {
    const sibling = BigInt(pathElements[i]);
    const isRight = pathIndices[i] === 1;
    const left = isRight ? sibling : current;
    const right = isRight ? current : sibling;
    current = toPoseidonBigInt(poseidon, poseidon([left, right]));
  }

  const merkleRoot = current;
  const nullifier = toPoseidonBigInt(poseidon, poseidon([secret, proposalId]));

  const input = {
    merkleRoot: merkleRoot.toString(),
    nullifier: nullifier.toString(),
    proposalId: proposalId.toString(),
    voteChoice: voteChoice.toString(),
    secret: secret.toString(),
    voterAddress: voterAddress.toString(),
    pathElements,
    pathIndices,
  };

  console.log('=== ZKNative Proof Generation ===');
  console.log('Proposal ID:  ', proposalId.toString());
  console.log('Vote choice:  ', ['Against', 'For', 'Abstain'][voteChoice]);
  console.log('Generating proof...');

  const start = Date.now();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH);
  const elapsed = Date.now() - start;

  console.log(`Proof generated in ${elapsed}ms`);
  console.log('Public signals:', publicSignals);

  // Verify locally
  const vk = JSON.parse(fs.readFileSync(VK_PATH, 'utf-8'));
  const valid = await snarkjs.groth16.verify(vk, publicSignals, proof);
  console.log('Local verification:', valid ? '✅ VALID' : '❌ INVALID');

  // Output Solidity-formatted proof
  const solidityCalldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  console.log('\nSolidity calldata:');
  console.log(solidityCalldata);

  // Write to file
  const outPath = path.join(__dirname, '..', 'proof_output.json');
  fs.writeFileSync(outPath, JSON.stringify({ proof, publicSignals }, null, 2));
  console.log(`\nProof written to ${outPath}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
