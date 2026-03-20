# Roadmap

## v0.1 — Hackathon MVP (current)

- [x] Groth16 ZK verifier in Rust (arkworks, BN254)
- [x] PVM FFI entry point (`pvm_verify`)
- [x] `ZKNativeVerifier.sol` with PVM + Solidity dual backend
- [x] `PrivateVoting.sol` with nullifier-based anti-replay
- [x] `VotingGovernor.sol` + `ZKNToken` (full OZ Governor)
- [x] circom circuit for 20-level Merkle eligibility proof
- [x] Next.js frontend with in-browser proof generation
- [x] CI/CD (Foundry tests + Rust tests + frontend build)

## v0.2 — Production Hardening (post-hackathon)

- [x] Trusted setup artifacts checked into the repo for the current voting circuit
- [x] Replace placeholder VK constants with ceremony output
- [x] Multi-proposal support in the frontend
- [x] Live proposal dashboard backed by deployed contracts
- [x] Browser proof asset sync for production builds
- [ ] Merkle tree generation script (batch eligible-voter onboarding)
- [x] Full snarkjs proof generation integrated in frontend
- [ ] PLONK circuit variant (universal setup, no ceremony required)

## v0.3 — Cross-Parachain Voting (XCM)

- [ ] XCM integration: voters from any Polkadot parachain can participate
- [ ] Eligibility proofs based on cross-chain token balances (via XCM queries)
- [ ] Aggregated nullifier set shared across parachains

## v1.0 — General ZK Computation Platform

- [ ] Generalize `ZKNativeVerifier` to support arbitrary circuits (pluggable VK)
- [ ] SDK for circuit developers to deploy Rust verifiers via PVM
- [ ] ZK co-processor pattern: off-chain computation with on-chain verification
- [ ] Support for STARK verifiers (plonky2, starky) via PVM
- [ ] DAO treasury controlled by governor for bounties and grants

## Long-term Vision

ZKNative aims to become the **ZK infrastructure layer for Polkadot** — making it trivial
for any project to add privacy-preserving proofs to their contracts using whatever ZK
system they choose, without waiting for protocol-level precompile approvals.

The PVM FFI pattern pioneered here can be generalized to:
- Threshold signature verification (MPC outputs as Solidity inputs)
- Biometric/identity proofs with native crypto libraries
- High-performance DeFi computations in Rust
- Any native library that would take too long to port to Solidity
