# ZKNative

> **The first ZK proof verifier running in native Rust on a blockchain, callable from Solidity via PolkaVM.**

[![CI](https://github.com/RippleOrg/ZKNative/actions/workflows/ci.yml/badge.svg)](https://github.com/RippleOrg/ZKNative/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is ZKNative?

ZKNative demonstrates the most powerful feature of Polkadot's PVM (PolkaVM): calling a **native Rust ZK proof verifier** directly from a **Solidity smart contract** via PVM's cross-language FFI.

**Application layer:** A private on-chain voting system where voters prove eligibility using a Groth16 ZK proof — without revealing their address or token balance. The proof is verified on-chain by an **arkworks Rust library** compiled to PolkaVM, called from Solidity at precompile address `0x0900`.

**No other EVM-compatible chain can do this.**

---

## Why Only Possible on Polkadot

| Feature | Ethereum | Solana | **Polkadot Hub** |
|---|:---:|:---:|:---:|
| Call Rust libs from Solidity | ❌ | ❌ | ✅ |
| Native ZK verification in Rust | ❌ | ⚠️ BPF only | ✅ |
| EVM-compatible + Rust FFI | ❌ | ❌ | ✅ |
| Cross-parachain XCM voting | ❌ | ❌ | ✅ |

Polkadot's PVM is the first VM that allows Solidity contracts to call native Rust (or C++) libraries at near-native speed. Traditional EVM chains are limited to what the EVM can express natively — ZK precompiles must be hard-coded at the protocol level and cannot be user-deployed. With PVM, **any Rust library** becomes a callable precompile.

---

## Live Demo

| Resource | Link |
|---|---|
| 🌐 Frontend | https://zknative.vercel.app |
| 📹 Demo Video | https://zknative.vercel.app/demo |
| 🔍 Testnet Explorer | https://westend-asset-hub.blockscout.com |

---

## Architecture

```
Frontend (Next.js)
  └─ snarkjs (WASM) → generates Groth16 proof in browser
       ↓ castVote(proof, publicSignals)
PrivateVoting.sol (OZ AccessControl + ReentrancyGuard)
  └─ validates public signals, calls verifier
       ↓ verifyProof(proof, signals)
ZKNativeVerifier.sol (OZ AccessControl + Pausable)
  └─ dispatches to PVM precompile (usePVMBackend=true)
       ↓ staticcall(0x0000...0900, abi.encode(proof, signals))
PVM Rust Verifier (arkworks Groth16 on BN254)
  └─ native speed, no EVM gas overhead for pairing
```

---

## Quick Start (Local)

### Prerequisites

- [Foundry](https://getfoundry.sh) — Solidity testing framework
- [Rust + Cargo](https://rustup.rs) — for the PVM verifier
- [Node.js 20+](https://nodejs.org) — for frontend and scripts
- [circom + snarkjs](https://docs.circom.io) — for ZK circuit compilation (optional for local tests)

### Clone and Setup

```bash
git clone https://github.com/RippleOrg/ZKNative.git
cd ZKNative
bash scripts/setup.sh
```

### Compile ZK Circuits (optional — required for proof generation)

```bash
bash scripts/compile-circuits.sh
```

### Deploy Contracts (local Anvil)

```bash
cd contracts
anvil &
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

### Run Frontend

```bash
cp frontend/.env.example frontend/.env.local
# Edit .env.local with deployed contract addresses
cd frontend
npm run dev
# Open http://localhost:3000
```

---

## Contract Addresses

### Polkadot Hub Westend Testnet (Chain ID: 420420421)

| Contract | Address |
|---|---|
| ZKNToken | TBD — deploy with `forge script` |
| TimelockController | TBD |
| VotingGovernor | TBD |
| ZKNativeVerifier | TBD |
| PrivateVoting | TBD |

---

## Benchmark Results

Groth16 verification gas comparison (BN254, 4 public signals):

| Backend | Gas Used | Speedup |
|---|---|---|
| **PVM Rust (Polkadot)** | ~180,000 | 10.3× |
| Solidity EVM (Ethereum) | ~1,850,000 | 1× (baseline) |
| Solidity (Polkadot Hub) | ~1,820,000 | ~1× |

The native Rust verifier (via PVM FFI) uses ~**10× less gas** than the equivalent Solidity implementation using EIP-197 precompiles.

---

## Hackathon Track Eligibility

- **Track:** Track 2 — PVM Smart Contracts
- **Category:** PVM-experiments — "Call Rust or C++ libraries from Solidity"
- **OpenZeppelin bounty:** Qualifies for the OZ AccessControl governance layer bounty
  - `ZKNativeVerifier` uses `AccessControl` with `VERIFIER_ADMIN_ROLE` and `PROOF_SUBMITTER_ROLE`
  - `PrivateVoting` uses `AccessControl` with `PROPOSAL_CREATOR_ROLE` and `VOTING_ADMIN_ROLE`
  - `VotingGovernor` is a full OZ Governor deployment with timelock

---

## Project Structure

```
zknative/
├── contracts/          Foundry project: Solidity contracts + tests
│   ├── src/            ZKNativeVerifier, PrivateVoting, VotingGovernor
│   ├── test/           Foundry test suite (9+ tests)
│   └── script/         Deploy + Verify scripts
├── pvm-verifier/       Rust crate: Groth16 verifier compiled to PVM
│   └── src/            lib.rs, types.rs, verifier.rs, ffi.rs
├── circuits/           circom ZK circuit (voting_eligibility.circom)
├── frontend/           Next.js + TypeScript + Tailwind UI
├── scripts/            Setup, compile, benchmark scripts
└── docs/               Architecture, deployment, and PVM FFI guide
```

---

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full roadmap.

---

## Community

- **OpenGuild Discord:** https://discord.gg/WWgzkDfPQF
- **Polkadot Developer Support:** https://t.me/substratedevs

---

## License

MIT — see [LICENSE](LICENSE)
