pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/mux1.circom";

/*
 * VotingEligibility circuit
 *
 * Proves that a voter:
 *   1. Knows the preimage (secret, address) of a leaf in the eligibility Merkle tree.
 *   2. Has a valid Merkle path from their leaf to the published root.
 *   3. Commits to a specific vote choice and proposal without revealing their identity.
 *
 * Public inputs / outputs (must match PrivateVoting.sol publicSignals layout):
 *   [0] merkleRoot   — root of the voter-eligibility Merkle tree
 *   [1] nullifier    — H(secret, proposalId) — unique per voter per proposal
 *   [2] proposalId   — the proposal being voted on
 *   [3] voteChoice   — 0 = against, 1 = for, 2 = abstain
 *
 * Private inputs:
 *   secret           — voter's secret random value
 *   voterAddress     — voter's on-chain address (kept private)
 *   pathElements[n]  — sibling hashes in the Merkle path
 *   pathIndices[n]   — 0/1 indicating left/right at each level
 */

template VotingEligibility(levels) {
    // ─── Public signals ────────────────────────────────────────────────
    signal input merkleRoot;
    signal input nullifier;
    signal input proposalId;
    signal input voteChoice;

    // ─── Private inputs ────────────────────────────────────────────────
    signal input secret;
    signal input voterAddress;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // ─── 1. Compute leaf = Poseidon(secret, voterAddress) ──────────────
    component leafHasher = Poseidon(2);
    leafHasher.inputs[0] <== secret;
    leafHasher.inputs[1] <== voterAddress;
    signal leaf <== leafHasher.out;

    // ─── 2. Compute nullifier = Poseidon(secret, proposalId) ───────────
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secret;
    nullifierHasher.inputs[1] <== proposalId;
    signal computedNullifier <== nullifierHasher.out;

    // Enforce that the public nullifier matches the computed one
    nullifier === computedNullifier;

    // ─── 3. Merkle path verification ───────────────────────────────────
    component hashers[levels];
    component muxLeft[levels];
    component muxRight[levels];

    signal levelHashes[levels + 1];
    levelHashes[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        pathIndices[i] * (pathIndices[i] - 1) === 0; // must be 0 or 1

        hashers[i] = Poseidon(2);

        // If pathIndices[i] == 0: left = levelHashes[i], right = pathElements[i]
        // If pathIndices[i] == 1: left = pathElements[i], right = levelHashes[i]
        muxLeft[i] = Mux1();
        muxLeft[i].c[0] <== levelHashes[i];
        muxLeft[i].c[1] <== pathElements[i];
        muxLeft[i].s <== pathIndices[i];

        muxRight[i] = Mux1();
        muxRight[i].c[0] <== pathElements[i];
        muxRight[i].c[1] <== levelHashes[i];
        muxRight[i].s <== pathIndices[i];

        hashers[i].inputs[0] <== muxLeft[i].out;
        hashers[i].inputs[1] <== muxRight[i].out;
        levelHashes[i + 1] <== hashers[i].out;
    }

    // 4. Enforce the root matches
    merkleRoot === levelHashes[levels];

    // 5. Enforce voteChoice ∈ {0, 1, 2}
    // Use the fact that voteChoice * (voteChoice - 1) * (voteChoice - 2) == 0
    signal vc_minus_1 <== voteChoice - 1;
    signal vc_minus_2 <== voteChoice - 2;
    signal tmp1 <== voteChoice * vc_minus_1;
    signal tmp2 <== tmp1 * vc_minus_2;
    tmp2 === 0;
}

component main {public [merkleRoot, nullifier, proposalId, voteChoice]} =
    VotingEligibility(20);
