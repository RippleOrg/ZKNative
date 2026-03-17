# Architecture

## Overview

ZKNative is a private on-chain voting system built on Polkadot Hub that demonstrates PolkaVM's
cross-language FFI: a Solidity smart contract calling a native Rust ZK proof verifier.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Next.js Frontend                                          │   │
│  │  ├─ snarkjs (WASM) — generates Groth16 proof             │   │
│  │  ├─ wagmi/viem — wallet + contract interaction           │   │
│  │  └─ ProofGenerator, VoteSubmitter, BenchmarkChart        │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ castVote(proposalId, proof, signals)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Polkadot Hub (EVM layer)                                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PrivateVoting.sol (OZ AccessControl + ReentrancyGuard)  │    │
│  │  ├─ validate public signals                             │    │
│  │  ├─ check nullifier (anti-replay)                       │    │
│  │  └─ call verifier.verifyProof()                         │    │
│  └──────────────────────────────┬──────────────────────────┘    │
│                                  │ verifyProof(proof, signals)   │
│  ┌───────────────────────────────▼──────────────────────────┐   │
│  │ ZKNativeVerifier.sol (OZ AccessControl + Pausable)       │   │
│  │  ├─ usePVMBackend=true: → staticcall(0x0900, encoded)    │   │
│  │  └─ usePVMBackend=false: → Solidity BN128 pairing        │   │
│  └──────────────────────────────┬──────────────────────────┘    │
│                                  │ PVM FFI (staticcall)          │
│  ┌───────────────────────────────▼──────────────────────────┐   │
│  │ PolkaVM Runtime                                           │   │
│  │  └─ Precompile 0x0900: pvm_verify() in Rust              │   │
│  └──────────────────────────────┬──────────────────────────┘    │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ native execution
┌─────────────────────────────────▼───────────────────────────────┐
│  PVM Rust Verifier (no_std, compiled to PolkaVM)                 │
│  ├─ ffi.rs — ABI decode Solidity calldata                        │
│  ├─ verifier.rs — arkworks Groth16::verify on BN254              │
│  └─ types.rs — G1Point, G2Point, Proof, VerificationKey          │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. PVM Precompile vs Solidity Fallback

`ZKNativeVerifier` supports two backends:
- **PVM Rust** (`usePVMBackend=true`, default): Calls the native Rust verifier via `staticcall`
  to precompile address `0x0900`. ~10× more gas-efficient.
- **Solidity** (`usePVMBackend=false`): Full BN128 pairing using EIP-197 precompiles.
  Used for non-PVM environments (Ethereum, local Anvil testing).

The admin can switch backends at any time via `switchBackend(bool)`.

### 2. Privacy Model

Voter privacy is provided by the ZK circuit:
- The **nullifier** (`H(secret, proposalId)`) prevents double-voting without linking votes to addresses.
- The **Merkle proof** verifies membership in the eligibility set without revealing the voter's leaf index.
- The **public signals** are: merkleRoot, nullifier, proposalId, voteChoice — no address leaked.

### 3. Governance

`VotingGovernor` (OZ Governor + TimelockController) governs protocol parameters:
- Updating the voter eligibility Merkle root
- Switching the verifier backend
- Granting new proposal-creator roles
- Pausing/unpausing contracts

### 4. Gas Efficiency

| Operation | Gas (PVM Rust) | Gas (Solidity) |
|---|---|---|
| Full verification | ~180,000 | ~1,850,000 |
| Pairing check | ~150,000 | ~1,700,000 |
| IC linear combination | ~20,000 | ~120,000 |
