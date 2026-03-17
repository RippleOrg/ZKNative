# PVM FFI Guide

## Overview

PolkaVM's cross-language FFI allows Solidity contracts to call native Rust (or C++) code
by performing a `staticcall` to a designated precompile address. The Rust code is compiled
to PolkaVM bytecode and registered as a precompile by the chain runtime.

## How It Works

### Solidity Side

```solidity
// Precompile address registered by the PolkaVM runtime
address constant PVM_GROTH16_PRECOMPILE = 0x0000000000000000000000000000000000000900;

function _verifyViaPVM(
    Proof calldata proof,
    uint256[] calldata publicSignals
) internal view returns (bool) {
    // ABI-encode the inputs exactly as Solidity would
    bytes memory encoded = abi.encode(proof.a, proof.b, proof.c, publicSignals);
    
    // staticcall dispatches to the Rust PVM verifier
    (bool success, bytes memory result) = PVM_GROTH16_PRECOMPILE.staticcall(encoded);
    if (!success) revert PrecompileCallFailed();
    
    return abi.decode(result, (bool));
}
```

### Rust Side (PVM)

```rust
// lib.rs — PVM entry point
#[cfg(feature = "pvm")]
#[no_mangle]
pub extern "C" fn pvm_verify(
    input_ptr: *const u8,
    input_len: usize,
    output_ptr: *mut u8,
) -> usize {
    ffi::handle_pvm_call(input_ptr, input_len, output_ptr)
}
```

### ABI Encoding Convention

The Rust verifier expects input encoded as `abi.encode(proof.a, proof.b, proof.c, publicSignals)`:

| Offset | Size | Field |
|--------|------|-------|
| 0x000 | 32 | proof.a[0] (G1 x) |
| 0x020 | 32 | proof.a[1] (G1 y) |
| 0x040 | 32 | proof.b[0][0] (G2 x.c0) |
| 0x060 | 32 | proof.b[0][1] (G2 x.c1) |
| 0x080 | 32 | proof.b[1][0] (G2 y.c0) |
| 0x0a0 | 32 | proof.b[1][1] (G2 y.c1) |
| 0x0c0 | 32 | proof.c[0] (G1 x) |
| 0x0e0 | 32 | proof.c[1] (G1 y) |
| 0x100 | 32 | offset to publicSignals array |
| 0x120 | 32 | length of publicSignals |
| 0x140 | 32*n | publicSignals[0..n] |

The output is a 32-byte ABI-encoded `bool` (0x00...01 for true, 0x00...00 for false).

## Compiling for PVM

```bash
cd pvm-verifier

# Add the PolkaVM target (requires polkavm-linker)
rustup target add riscv32em-unknown-none-elf

# Build for PVM
cargo build --release --target riscv32em-unknown-none-elf --features pvm --no-default-features

# The output is in target/riscv32em-unknown-none-elf/release/
```

## Registering the Precompile

On Polkadot Hub, the PVM verifier is registered by including its bytecode in the chain spec's
`precompiles` map at address `0x0900`. This is done by the chain operator, not the contract
deployer.

For the hackathon testnet, the precompile is pre-registered by the Polkadot Hub team.

## Gas Model

PVM precompile calls are billed differently from EVM operations:
- The `staticcall` costs a base fee of ~1,000 gas
- The PVM execution is billed at a separate PVM-native rate (~10× cheaper than EVM pairing)
- The total gas charge reflects both EVM overhead + PVM native execution

## Fallback Behavior

`ZKNativeVerifier` falls back to the Solidity pairing implementation when:
- `usePVMBackend = false` (set by admin)
- Running on Ethereum or Anvil (no PVM precompile at 0x0900)

This makes the contract fully portable while still demonstrating the PVM advantage.
