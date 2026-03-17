# Circuits

This directory contains the circom ZK circuits for ZKNative.

## Overview

`voting_eligibility.circom` implements the privacy-preserving voting eligibility proof:

- **Public inputs**: `merkleRoot`, `nullifier`, `proposalId`, `voteChoice`
- **Private inputs**: `secret`, `voterAddress`, `pathElements[20]`, `pathIndices[20]`

The circuit proves that the voter:
1. Knows the secret preimage of a leaf in the eligibility Merkle tree
2. Has a valid Merkle path to the published root (20-level tree = 2^20 ≈ 1M eligible voters)
3. Commits to a specific vote without revealing their identity

## Compilation

```bash
# Install dependencies
npm install -g circom snarkjs

# Compile circuit and run trusted setup
cd circuits
bash compile.sh
```

This will:
1. Compile `voting_eligibility.circom` to R1CS + WASM
2. Download the Hermez Powers of Tau ceremony file
3. Generate the Groth16 proving and verification keys
4. Export the verification key for use in `ZKNativeVerifier.sol` and the PVM Rust verifier

## Output Files

After running `compile.sh`:

| File | Description |
|------|-------------|
| `build/voting_eligibility.r1cs` | R1CS constraint system |
| `build/voting_eligibility_js/` | WASM witness generator |
| `build/voting_eligibility_final.zkey` | Groth16 proving key |
| `build/verification_key.json` | Verification key (JSON) |
| `../pvm-verifier/keys/voting_vk_placeholder.bin` | Binary VK for PVM Rust verifier |

## Updating Contract Constants

After compilation, update the VK constants in `ZKNativeVerifier.sol` constructor with the values from `build/verification_key.json`.
