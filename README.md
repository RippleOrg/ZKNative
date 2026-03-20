# ZKNative

> Native Rust Groth16 verification for Solidity on Polkadot Hub, shipped with a live private-voting app.

[![CI](https://github.com/RippleOrg/ZKNative/actions/workflows/ci.yml/badge.svg)](https://github.com/RippleOrg/ZKNative/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

ZKNative demonstrates the part of Polkadot’s PVM that other EVM-compatible environments do not expose: a Solidity contract can delegate heavy proof verification work to native Rust through PolkaVM FFI.

This repository now includes:

- A live, chain-backed private voting console
- A live proposal dashboard with create and finalize actions
- Browser-side Groth16 proof generation using synced circuit assets
- A Rust verifier for PolkaVM plus a Solidity fallback verifier
- Checked-in trusted setup artifacts for the current voting circuit

The current application focus is private governance: a voter proves eligibility against a Merkle root, commits to a proposal and vote choice, and submits a nullifier-protected ballot without revealing the qualifying wallet on-chain.

## Why This Is Polkadot-Native

| Feature | Ethereum | Solana | Polkadot Hub |
|---|:---:|:---:|:---:|
| Solidity can call native Rust | ❌ | ❌ | ✅ |
| User-deployed Rust verifier path | ❌ | ⚠️ | ✅ |
| EVM app + native verifier in one flow | ❌ | ❌ | ✅ |
| Reusable verifier for multiple privacy apps | ⚠️ | ⚠️ | ✅ |

With PolkaVM, the verifier logic does not need to be permanently embedded as a protocol precompile. The app contract stays in Solidity, while the heavy cryptography can live in Rust.

## Live Deployment

- Frontend: `https://zknative.vercel.app`
- Explorer: `https://westend-asset-hub.blockscout.com`
- Chain: Polkadot Hub Testnet
- Chain ID: `420420417`
- PVM verifier entrypoint: `0x0000000000000000000000000000000000000900`

### Public Testnet Addresses

These addresses come from [`contracts/broadcast/addresses.json`](contracts/broadcast/addresses.json).

| Contract | Address |
|---|---|
| ZKNToken | `0xA1D135E125e1C1B5713478266E18d85d66273a48` |
| TimelockController | `0x7c0b03Db2a95bd3352788e236bc8cc1e8fD449A5` |
| VotingGovernor | `0xf7E7080A077ae14eCf13389DC1Fa068aD87e6B76` |
| ZKNativeVerifier | `0x79a8979b0ed0F57CD840e2BBC3CA7071E37913d0` |
| PrivateVoting | `0x4eA0e6Bc7e76ed28CF39381e58fBC6193f5a8b43` |

### Deployment Note

The repo now contains refreshed verifier constants generated from the checked-in circuit artifacts. If you want the public testnet deployment to match the latest contract source byte-for-byte, redeploy from the current repo state.

## What The App Does Today

### Live Private Voting

- Reads proposal data and the live Merkle root from the deployed `PrivateVoting` contract
- Generates Groth16 proofs in the browser using `snarkjs`
- Checks nullifier reuse before submission
- Submits private votes to the deployed contract through a connected EVM wallet

### Live Governance Console

- Reads `proposalCount` and proposal structs directly from chain
- Shows real aggregate tallies instead of hard-coded demo data
- Allows authorized operators to create new proposals
- Allows ended proposals to be finalized on-chain

### Production-Ready Frontend Plumbing

- Circuit assets are synced into `frontend/public/circuits` automatically during `npm run dev` and `npm run build`
- Deployment metadata is synced into `frontend/public/deployments`
- The app now ships with a usable `frontend/.env.example`

### Important Operator Requirement

To cast a valid private vote, a voter still needs a correct eligibility bundle:

- `secret`
- `nullifier`
- `pathElements[20]`
- `pathIndices[20]`
- The eligible address used in the Merkle leaf

Those values must match the current on-chain Merkle root.

## Architecture

```text
Frontend (Next.js)
  └─ snarkjs + synced WASM/zkey assets
       ↓ castVote(proof, publicSignals)
PrivateVoting.sol
  └─ validates proposal window, Merkle root, nullifier, and vote choice
       ↓ verifyProof(proof, publicSignals)
ZKNativeVerifier.sol
  └─ dispatches to PVM native verifier or Solidity fallback
       ↓ staticcall(0x...0900, abi.encode(...))
PVM Rust verifier
  └─ arkworks Groth16 verification on BN254
```

## Benchmarks

Current benchmark target for Groth16 verification with 4 public signals:

| Backend | Gas Used | Relative Cost |
|---|---:|---:|
| PVM Rust on Polkadot | `~180,000` | `1x` |
| Solidity verifier on EVM | `~1,850,000` | `~10.3x` |
| Solidity verifier on Polkadot Hub | `~1,820,000` | `~10.1x` |

The practical point of the project is not just “ZK works on-chain”; it is “ZK verification can be moved into native Rust while keeping the application interface in Solidity”.

## Quick Start

### Prerequisites

- [Foundry](https://getfoundry.sh)
- [Rust](https://rustup.rs)
- Node.js 20+
- `circom` and `snarkjs` for circuit recompilation

### Install

```bash
git clone https://github.com/RippleOrg/ZKNative.git
cd ZKNative
bash scripts/setup.sh
```

### Rebuild The Circuit Artifacts

```bash
bash scripts/compile-circuits.sh
```

This updates:

- `circuits/build/`
- `contracts/src/GeneratedVerifier.sol`
- `pvm-verifier/keys/voting_vk_placeholder.bin`

### Run The Frontend

```bash
cp frontend/.env.example frontend/.env.local
cd frontend
npm run dev
```

The frontend automatically copies the latest proving assets into `frontend/public/circuits` before dev and production builds.

### Deploy Contracts Locally

```bash
cd contracts
anvil
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

### Generate A Sample Proof Locally

```bash
npm run generate-proof -- 1 1
```

## Verification Status

The current repo state was checked with:

- `npm run --prefix frontend lint`
- `npm run --prefix frontend type-check`
- `npm run --prefix frontend build`
- `npm run test:rust`
- `cd contracts && forge build`

### Known Environment Issue

`forge test` currently crashes in this macOS environment because of an upstream Foundry/system proxy bug inside `system-configuration` rather than a Solidity compile failure. The contracts do compile successfully with `forge build`.

## Project Structure

```text
contracts/       Solidity contracts, tests, scripts, broadcast metadata
circuits/        circom circuit, proving assets, verification key output
pvm-verifier/    Rust verifier compiled for the PVM path
frontend/        Next.js application with live vote and results pages
scripts/         setup, benchmarking, proof generation, asset sync
docs/            architecture, deployment notes, roadmap
```

## Project Vision

ZKNative is meant to become a reusable privacy and high-performance verification layer for Polkadot applications.

The voting app is the first product surface, but the larger idea is broader:

- Let Solidity teams keep their app logic and tooling
- Let Rust handle cryptography-heavy or performance-sensitive verification work
- Make privacy-preserving UX normal for governance, claims, credentials, and gated access
- Turn PolkaVM FFI into a general pattern for bringing native libraries into smart-contract apps

## Roadmap

### Near Term

- Ship Merkle tree generation and eligibility bundle tooling
- Add a first-class operator flow for allowlist management
- Redeploy the public verifier stack from the latest source state
- Add richer transaction and proof diagnostics in the UI

### Mid Term

- Cross-parachain voting and eligibility sources
- Additional privacy app templates beyond governance
- PLONK or universal-setup variants

### Long Term

- Generalize `ZKNativeVerifier` for arbitrary circuit families
- Publish SDK tooling for Rust-backed verifier deployment on Polkadot
- Expand from voting into a broader ZK co-processor and privacy infrastructure layer

See [docs/roadmap.md](docs/roadmap.md) for the evolving roadmap.

## Community

- OpenGuild Discord: `https://discord.gg/WWgzkDfPQF`
- Polkadot developer support: `https://t.me/substratedevs`

## License

MIT
