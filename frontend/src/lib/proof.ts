// ZK proof generation using snarkjs

export interface ZKProof {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
}

export interface ProofInputs {
  secret: bigint;
  nullifier: bigint;
  voterAddress: bigint;
  pathElements: bigint[];
  pathIndices: number[];
  merkleRoot: bigint;
  proposalId: bigint;
  voteChoice: number;
}

export interface ProofOutput {
  proof: ZKProof;
  publicSignals: bigint[];
  nullifier: bigint;
}

/**
 * Generate a Groth16 ZK proof for voting eligibility.
 *
 * @param inputs The private + public inputs for the circuit
 * @param wasmPath Path or URL to the circuit WASM witness generator
 * @param zkeyPath Path or URL to the proving key (.zkey)
 */
export async function generateVotingProof(
  inputs: ProofInputs,
  wasmPath: string = '/circuits/voting_eligibility.wasm',
  zkeyPath: string = '/circuits/voting_eligibility_final.zkey'
): Promise<ProofOutput> {
  // Dynamic import to avoid SSR issues
  const snarkjs = await import('snarkjs');

  const circuitInputs = {
    merkleRoot: inputs.merkleRoot.toString(),
    nullifier: inputs.nullifier.toString(),
    proposalId: inputs.proposalId.toString(),
    voteChoice: inputs.voteChoice.toString(),
    secret: inputs.secret.toString(),
    voterAddress: inputs.voterAddress.toString(),
    pathElements: inputs.pathElements.map((e) => e.toString()),
    pathIndices: inputs.pathIndices,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInputs,
    wasmPath,
    zkeyPath
  );

  return {
    proof: {
      a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
      b: [
        [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
        [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
      ],
      c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
    },
    publicSignals: publicSignals.map((s: string) => BigInt(s)),
    nullifier: BigInt(publicSignals[1]),
  };
}

/**
 * Convert a proof to Solidity-compatible uint256 format.
 */
export function proofToSolidity(proof: ZKProof): {
  a: readonly [bigint, bigint];
  b: readonly [readonly [bigint, bigint], readonly [bigint, bigint]];
  c: readonly [bigint, bigint];
} {
  return {
    a: proof.a,
    b: proof.b,
    c: proof.c,
  };
}
